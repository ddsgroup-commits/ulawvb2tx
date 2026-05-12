// GET /api/calendar/google/connect
// Redirects the authenticated user to Google's OAuth consent screen.
// The `state` parameter carries the user ID to validate in the callback.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  }

  if (!process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Google Calendar integration is not configured on this server." },
      { status: 503 },
    );
  }

  // State = base64(userId) so we can match it in the callback
  const state = Buffer.from(session.user.id).toString("base64url");
  const url = buildAuthUrl(state);
  return NextResponse.redirect(url);
}
