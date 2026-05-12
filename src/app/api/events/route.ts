import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfMonth, endOfMonth } from "date-fns";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  type: z.enum(["CLASS", "EXAM", "DEADLINE", "EVENT"]),
  time: z.string().optional(),
  room: z.string().optional(),
  onlineLink: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  subject: z.string().optional(),
  reminderMinutes: z.number().int().min(0).max(10080).optional(),
  courseId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

    const from = startOfMonth(new Date(year, month - 1));
    const to = endOfMonth(new Date(year, month - 1));

    const events = await prisma.event.findMany({
      where: { date: { gte: from, lte: to } },
      include: { course: { select: { name: true, slug: true } } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ ok: true, data: events });
  } catch {
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const event = await prisma.event.create({
      data: { ...data, creatorId: session.user.id },
      include: { course: { select: { name: true, slug: true } } },
    });
    return NextResponse.json({ ok: true, data: event }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
