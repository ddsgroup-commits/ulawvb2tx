// GET /api/calendar/google/status
// Returns the current user's Google Calendar connection status.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = await prisma.googleCalendarToken.findUnique({
    where: { userId: session.user.id },
    select: {
      calendarId: true,
      lastSyncAt: true,
      lastSyncError: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  if (!token) {
    return NextResponse.json({ ok: true, connected: false });
  }

  return NextResponse.json({
    ok: true,
    connected: true,
    calendarId: token.calendarId ?? "primary",
    lastSyncAt: token.lastSyncAt,
    lastSyncError: token.lastSyncError,
    connectedAt: token.createdAt,
  });
}
