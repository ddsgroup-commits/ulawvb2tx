import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const KEYS = ["className", "semester", "contactEmail", "googleCalendar", "formUpdate", "zaloGroup"];

export async function GET() {
  const configs = await prisma.siteConfig.findMany({ where: { key: { in: KEYS } } });
  const data: Record<string, string> = {};
  for (const c of configs) data[c.key] = c.value;
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  const body = await req.json();
  for (const key of KEYS) {
    if (body[key] !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: String(body[key]) },
        create: { key, value: String(body[key]) },
      });
    }
  }
  return NextResponse.json({ ok: true, data: null });
}
