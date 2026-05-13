import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { locales, LOCALE_COOKIE } from "@/i18n/config";

const bodySchema = z.object({ locale: z.enum(locales) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid locale" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true });
}
