import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseVideoUrl } from "@/lib/video";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true, slug: true } },
      progress: { where: { userId: session.user.id }, take: 1 },
    },
  });
  if (!lesson) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role);
  if (!isAdmin && lesson.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: lesson });
}

const updateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  type: z.enum(["VIDEO", "READING", "QUIZ", "MIXED"]).optional(),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  attachments: z.array(z.string().url()).max(30).optional(),
  durationMin: z.number().int().positive().max(600).optional().nullable(),
  order: z.number().int().min(0).max(1000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = updateSchema.parse(await req.json());
    const parsed = data.videoUrl ? parseVideoUrl(data.videoUrl) : null;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.videoUrl !== undefined
          ? {
              videoUrl: data.videoUrl || null,
              videoSource: parsed?.source ?? null,
              videoEmbed: parsed?.embedUrl ?? null,
              thumbnailUrl: parsed?.thumbnailUrl ?? null,
            }
          : {}),
        ...(data.attachments !== undefined ? { attachments: data.attachments } : {}),
        ...(data.durationMin !== undefined ? { durationMin: data.durationMin } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    await logAudit(req, session.user.id, "UPDATE_LESSON", "Lesson", lesson.id);
    return NextResponse.json({ ok: true, data: lesson });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    console.error("[lessons PATCH]", e);
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    await prisma.lesson.delete({ where: { id } });
    await logAudit(req, session.user.id, "DELETE_LESSON", "Lesson", id);
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }
}
