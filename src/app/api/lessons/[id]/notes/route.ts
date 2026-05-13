import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/lessons/[id]/notes — returns the caller's note for this lesson
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  const note = await prisma.lessonNote.findUnique({
    where: { lessonId_userId: { lessonId: id, userId: session.user.id } },
  });
  return NextResponse.json({ ok: true, data: note });
}

// PUT /api/lessons/[id]/notes — upsert the caller's note
const upsertSchema = z.object({
  content: z.string().max(50000),
});

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }

  // Verify lesson exists + is visible to this user.
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!lesson) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role);
  if (!isAdmin && lesson.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }

  try {
    const data = upsertSchema.parse(await req.json());
    const note = await prisma.lessonNote.upsert({
      where: { lessonId_userId: { lessonId: id, userId: session.user.id } },
      update: { content: data.content },
      create: { lessonId: id, userId: session.user.id, content: data.content },
    });
    return NextResponse.json({ ok: true, data: note });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

// DELETE /api/lessons/[id]/notes
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  await prisma.lessonNote.deleteMany({
    where: { lessonId: id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true, data: null });
}
