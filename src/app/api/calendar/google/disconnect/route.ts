// POST /api/calendar/google/disconnect
// Revokes the user's Google OAuth token and deletes the record.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revokeToken } from "@/lib/google-calendar";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = await prisma.googleCalendarToken.findUnique({
    where: { userId: session.user.id },
  });

  if (!token) {
    return NextResponse.json({ ok: true, message: "Not connected" });
  }

  // Best-effort revoke — ignore network errors
  try {
    await revokeToken(token.refreshToken ?? token.accessToken);
  } catch (err) {
    console.warn("[gcal disconnect] revoke failed (continuing):", err);
  }

  await prisma.googleCalendarToken.delete({ where: { userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
