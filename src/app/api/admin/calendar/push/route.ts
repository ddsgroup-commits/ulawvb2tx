// POST /api/admin/calendar/push
// Admin-only: push one or all upcoming portal events to every connected
// student's Google Calendar.
//
// Body: { eventIds?: string[] }  — omit to push ALL upcoming events.
// Each student's token is refreshed individually if needed.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  refreshAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  portalEventToGCal,
} from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const eventIds: string[] | undefined = Array.isArray(body.eventIds) ? body.eventIds : undefined;

  // Fetch target events
  const events = await prisma.event.findMany({
    where: eventIds
      ? { id: { in: eventIds } }
      : { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 200,
  });

  if (events.length === 0) {
    return NextResponse.json({ ok: true, pushed: 0, userErrors: [] });
  }

  // Fetch all connected students
  const tokens = await prisma.googleCalendarToken.findMany({
    select: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      calendarId: true,
    },
  });

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, pushed: 0, message: "No students have connected Google Calendar yet." });
  }

  let totalPushed = 0;
  const userErrors: Array<{ userId: string; error: string }> = [];

  for (const tokenRow of tokens) {
    let accessToken = tokenRow.accessToken;

    // Refresh if expired
    if (tokenRow.expiresAt && tokenRow.expiresAt < new Date(Date.now() + 60_000)) {
      if (!tokenRow.refreshToken) {
        userErrors.push({ userId: tokenRow.userId, error: "No refresh token — user must reconnect." });
        await prisma.googleCalendarToken.update({
          where: { userId: tokenRow.userId },
          data: { lastSyncError: "Token expired; please reconnect Google Calendar." },
        });
        continue;
      }
      try {
        const fresh = await refreshAccessToken(tokenRow.refreshToken);
        accessToken = fresh.access_token;
        await prisma.googleCalendarToken.update({
          where: { userId: tokenRow.userId },
          data: {
            accessToken: fresh.access_token,
            ...(fresh.refresh_token ? { refreshToken: fresh.refresh_token } : {}),
            expiresAt: fresh.expires_in ? new Date(Date.now() + fresh.expires_in * 1000) : null,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        userErrors.push({ userId: tokenRow.userId, error: `Refresh failed: ${msg}` });
        continue;
      }
    }

    const calendarId = tokenRow.calendarId ?? "primary";
    let userPushed = 0;

    for (const ev of events) {
      const payload = portalEventToGCal({
        title: ev.title,
        description: ev.description,
        date: ev.date,
        endDate: ev.endDate,
        time: ev.time,
        room: ev.room,
        onlineLink: ev.onlineLink,
        type: ev.type,
        reminderMinutes: ev.reminderMinutes,
      });

      try {
        if (ev.googleCalendarEventId) {
          try {
            await updateCalendarEvent(accessToken, calendarId, ev.googleCalendarEventId, payload);
          } catch {
            const newId = await createCalendarEvent(accessToken, calendarId, payload);
            await prisma.event.update({ where: { id: ev.id }, data: { googleCalendarEventId: newId } });
          }
        } else {
          const newId = await createCalendarEvent(accessToken, calendarId, payload);
          await prisma.event.update({ where: { id: ev.id }, data: { googleCalendarEventId: newId } });
        }
        userPushed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        userErrors.push({ userId: tokenRow.userId, error: `Event "${ev.title}": ${msg}` });
      }
    }

    if (userPushed > 0) {
      await prisma.googleCalendarToken.update({
        where: { userId: tokenRow.userId },
        data: { lastSyncAt: new Date(), lastSyncError: null },
      });
    }

    totalPushed += userPushed;
  }

  return NextResponse.json({
    ok: true,
    pushed: totalPushed,
    connectedUsers: tokens.length,
    events: events.length,
    userErrors: userErrors.slice(0, 20),
  });
}
