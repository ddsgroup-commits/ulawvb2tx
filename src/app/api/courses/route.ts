import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: { lecturer: { select: { id: true, name: true } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ ok: true, data: courses });
}

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  lecturerId: z.string().optional().nullable(),
  notebooklmUrl: z.string().url().optional().nullable().or(z.literal("")),
  driveUrl: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]).optional(),
  icon: z.string().optional().nullable(),
  credits: z.number().int().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }
  try {
    const { id, ...rest } = await req.json();
    const data = updateSchema.parse(rest);
    const course = await prisma.course.update({
      where: { id },
      data,
      include: { lecturer: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ ok: true, data: course });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
