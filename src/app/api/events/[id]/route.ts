import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  type: z.enum(["CLASS", "EXAM", "DEADLINE", "EVENT"]).optional(),
  time: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = updateSchema.parse(await req.json());
    const event = await prisma.event.update({
      where: { id: params.id },
      data,
      include: { course: { select: { name: true, slug: true } } },
    });
    return NextResponse.json({ ok: true, data: event });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }
}
