import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  tag: z.enum(["LICH_HOC", "DEADLINE", "THAY_DOI", "THI_CU", "CHUNG_CHI", "KHAC"]).optional(),
  pinned: z.boolean().optional(),
  urgent: z.boolean().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const item = await prisma.announcement.update({
      where: { id: params.id },
      data,
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ ok: true, data: item });
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
    await prisma.announcement.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_ANNOUNCEMENT",
        entityType: "Announcement",
        entityId: params.id,
      },
    });
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Không tìm thấy hoặc lỗi máy chủ" }, { status: 404 });
  }
}
