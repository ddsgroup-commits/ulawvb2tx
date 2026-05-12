import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const items = await prisma.fAQ.findMany({
    where: { isPublic: true },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  // Group by category
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }

  const data = Object.entries(groups).map(([category, items]) => ({
    category,
    items,
  }));

  return NextResponse.json({ ok: true, data });
}

const createSchema = z.object({
  category: z.string().min(2),
  question: z.string().min(5),
  answer: z.string().min(10),
  order: z.number().int().optional().default(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = createSchema.parse(await req.json());
    const faq = await prisma.fAQ.create({ data });
    return NextResponse.json({ ok: true, data: faq }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await req.json();
  try {
    await prisma.fAQ.delete({ where: { id } });
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }
}
