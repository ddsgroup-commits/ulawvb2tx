// GET /api/calendar/google/callback
// Handles the OAuth callback from Google, stores tokens, then redirects
// the user back to the schedule page.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCode } from "@/lib/google-calendar";

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return NextResponse.redirect(`${BASE}/schedule?gcal=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE}/schedule?gcal=error`);
  }

  // Validate state: must match the logged-in user
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${BASE}/login`);
  }

  let stateUserId: string;
  try {
    stateUserId = Buffer.from(state, "base64url").toString();
  } catch {
    return NextResponse.redirect(`${BASE}/schedule?gcal=error`);
  }

  if (stateUserId !== session.user.id) {
    return NextResponse.redirect(`${BASE}/schedule?gcal=error`);
  }

  try {
    const tokens = await exchangeCode(code);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await prisma.googleCalendarToken.upsert({
      where: { userId: session.user.id },
      update: {
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiresAt,
        scope: tokens.scope,
        lastSyncError: null,
      },
      create: {
        userId: session.user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        scope: tokens.scope,
        calendarId: "primary",
      },
    });

    return NextResponse.redirect(`${BASE}/schedule?gcal=connected`);
  } catch (err) {
    console.error("[gcal callback]", err);
    return NextResponse.redirect(`${BASE}/schedule?gcal=error`);
  }
}
