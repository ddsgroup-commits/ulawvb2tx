import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { parseVideoUrl } from "@/lib/video";

// ── GET /api/lessons ──────────────────────────────────────────
// List lessons, optionally filtered by courseId. Students see
// PUBLISHED only; admins see everything. Includes the caller's own
// progress when ?withProgress=1.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role);

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId")?.trim();
  const courseSlug = searchParams.get("courseSlug")?.trim();
  const withProgress = searchParams.get("withProgress") === "1";

  // Resolve courseId from slug if given.
  let resolvedCourseId = courseId;
  if (!resolvedCourseId && courseSlug) {
    const c = await prisma.course.findUnique({ where: { slug: courseSlug }, select: { id: true } });
    resolvedCourseId = c?.id;
    if (!resolvedCourseId) return NextResponse.json({ ok: true, data: [] });
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(isAdmin ? {} : { status: "PUBLISHED" }),
      ...(resolvedCourseId ? { courseId: resolvedCourseId } : {}),
    },
    include: {
      course: { select: { id: true, name: true, slug: true } },
      ...(withProgress
        ? { progress: { where: { userId: session.user.id }, take: 1 } }
        : {}),
    },
    orderBy: [{ courseId: "asc" }, { order: "asc" }],
  });

  return NextResponse.json({ ok: true, data: lessons });
}

// ── POST /api/lessons ─────────────────────────────────────────
const createSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  type: z.enum(["VIDEO", "READING", "QUIZ", "MIXED"]).optional().default("VIDEO"),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  attachments: z.array(z.string().url()).max(30).optional().default([]),
  durationMin: z.number().int().positive().max(600).optional().nullable(),
  order: z.number().int().min(0).max(1000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("PUBLISHED"),
  slug: z.string().max(160).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = createSchema.parse(await req.json());
    const parsed = data.videoUrl ? parseVideoUrl(data.videoUrl) : null;

    // Derive a unique slug per course; append a numeric suffix on collision.
    const base = data.slug?.trim() ? slugify(data.slug) : slugify(data.title);
    let slug = base;
    for (let i = 2; i < 100; i++) {
      const existing = await prisma.lesson.findUnique({
        where: { courseId_slug: { courseId: data.courseId, slug } },
        select: { id: true },
      });
      if (!existing) break;
      slug = `${base}-${i}`;
    }

    // Default order = max + 1 if not specified.
    let order = data.order;
    if (order === undefined) {
      const last = await prisma.lesson.findFirst({
        where: { courseId: data.courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (last?.order ?? 0) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        slug,
        type: data.type ?? "VIDEO",
        description: data.description ?? null,
        content: data.content ?? null,
        videoUrl: data.videoUrl || null,
        videoSource: parsed?.source ?? null,
        videoEmbed: parsed?.embedUrl ?? null,
        thumbnailUrl: parsed?.thumbnailUrl ?? null,
        attachments: data.attachments ?? [],
        durationMin: data.durationMin ?? null,
        order,
        status: data.status ?? "PUBLISHED",
      },
      include: { course: { select: { name: true, slug: true } } },
    });

    await logAudit(req, session.user.id, "CREATE_LESSON", "Lesson", lesson.id, {
      title: lesson.title,
      courseId: lesson.courseId,
    });

    return NextResponse.json({ ok: true, data: lesson }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    console.error("[lessons POST]", e);
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
