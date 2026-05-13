import { NextResponse } from "next/server";

/** Public — client needs the VAPID public key to call PushManager.subscribe. */
export async function GET() {
  return NextResponse.json({
    key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  });
}
