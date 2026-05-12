// POST /api/calendar/google/sync
// Syncs upcoming portal events to the user's personal Google Calendar.
// Uses the stored OAuth token; refreshes it automatically if expired.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  refreshAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  portalEventToGCal,
} from "@/lib/google-calendar";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tokenRow = await prisma.googleCalendarToken.findUnique({
    where: { userId: session.user.id },
  });

  if (!tokenRow) {
    return NextResponse.json({ ok: false, error: "Google Calendar not connected" }, { status: 400 });
  }

  // Refresh access token if expired (with 60-second buffer)
  let accessToken = tokenRow.accessToken;
  if (tokenRow.expiresAt && tokenRow.expiresAt < new Date(Date.now() + 60_000)) {
    if (!tokenRow.refreshToken) {
      await prisma.googleCalendarToken.update({
        where: { userId: session.user.id },
        data: { lastSyncError: "Access token expired and no refresh token available. Please reconnect." },
      });
      return NextResponse.json({ ok: false, error: "Token expired — please reconnect Google Calendar" }, { status: 401 });
    }

    try {
      const fresh = await refreshAccessToken(tokenRow.refreshToken);
      accessToken = fresh.access_token;
      await prisma.googleCalendarToken.update({
        where: { userId: session.user.id },
        data: {
          accessToken: fresh.access_token,
          ...(fresh.refresh_token ? { refreshToken: fresh.refresh_token } : {}),
          expiresAt: fresh.expires_in ? new Date(Date.now() + fresh.expires_in * 1000) : null,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.googleCalendarToken.update({
        where: { userId: session.user.id },
        data: { lastSyncError: `Refresh failed: ${msg}` },
      });
      return NextResponse.json({ ok: false, error: "Could not refresh token. Please reconnect." }, { status: 401 });
    }
  }

  const calendarId = tokenRow.calendarId ?? "primary";

  // Fetch upcoming events (next 90 days)
  const from = new Date();
  const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  let synced = 0;
  let errors = 0;
  const syncErrors: string[] = [];

  for (const ev of events) {
    const gcalPayload = portalEventToGCal({
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
        // Try update first; create if the event was deleted on Google's side
        try {
          await updateCalendarEvent(accessToken, calendarId, ev.googleCalendarEventId, gcalPayload);
        } catch {
          const newId = await createCalendarEvent(accessToken, calendarId, gcalPayload);
          await prisma.event.update({
            where: { id: ev.id },
            data: { googleCalendarEventId: newId },
          });
        }
      } else {
        const newId = await createCalendarEvent(accessToken, calendarId, gcalPayload);
        await prisma.event.update({
          where: { id: ev.id },
          data: { googleCalendarEventId: newId },
        });
      }
      synced++;
    } catch (err) {
      errors++;
      syncErrors.push(`${ev.title}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const errorSummary = syncErrors.length > 0 ? syncErrors.slice(0, 3).join("; ") : null;

  await prisma.googleCalendarToken.update({
    where: { userId: session.user.id },
    data: {
      lastSyncAt: new Date(),
      lastSyncError: errorSummary,
    },
  });

  return NextResponse.json({
    ok: true,
    synced,
    errors,
    total: events.length,
    ...(errorSummary ? { errorSummary } : {}),
  });
}
