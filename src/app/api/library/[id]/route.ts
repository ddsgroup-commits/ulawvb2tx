import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    await prisma.libraryItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }
}

// Increment download count
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await prisma.libraryItem.update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
