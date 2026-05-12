import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseVideoUrl } from "@/lib/video";

// ── GET /api/videos ───────────────────────────────────────────
// Public listing for any logged-in user. Filters: q, subject,
// courseId, tag. Students only see PUBLISHED videos; admins see all.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const subject = searchParams.get("subject")?.trim();
  const courseId = searchParams.get("courseId")?.trim();
  const tag = searchParams.get("tag")?.trim();
  const take = Math.min(Number(searchParams.get("take") ?? 100), 200);

  const videos = await prisma.video.findMany({
    where: {
      ...(isAdmin ? {} : { contentStatus: "PUBLISHED" }),
      ...(subject ? { subject: { equals: subject, mode: "insensitive" } } : {}),
      ...(courseId ? { courseId } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { lecturer: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      course: { select: { id: true, name: true, slug: true } },
      uploader: { select: { name: true } },
    },
    orderBy: [{ pinned: "desc" }, { classDate: "desc" }, { createdAt: "desc" }],
    take,
  });

  return NextResponse.json({ ok: true, data: videos });
}

// ── POST /api/videos ──────────────────────────────────────────
// Admin/Editor only.
const createSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().max(5000).optional().nullable(),
  subject: z.string().max(120).optional().nullable(),
  courseId: z.string().optional().nullable(),
  lecturer: z.string().max(120).optional().nullable(),
  classDate: z.string().datetime().or(z.string().min(8)).optional().nullable(),
  url: z.string().url(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
  relatedDocs: z.array(z.string().url()).max(20).optional().default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("PUBLISHED"),
  pinned: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = createSchema.parse(await req.json());
    const parsed = parseVideoUrl(data.url);

    const video = await prisma.video.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        subject: data.subject ?? null,
        courseId: data.courseId || null,
        lecturer: data.lecturer ?? null,
        classDate: data.classDate ? new Date(data.classDate) : null,
        url: data.url,
        source: parsed.source,
        embedUrl: parsed.embedUrl,
        thumbnailUrl: parsed.thumbnailUrl,
        tags: data.tags ?? [],
        relatedDocs: data.relatedDocs ?? [],
        status: data.status ?? "PUBLISHED",
        pinned: data.pinned ?? false,
        uploaderId: session.user.id,
      },
      include: { course: { select: { name: true, slug: true } } },
    });

    await logAudit(req, session.user.id, "CREATE_VIDEO", "Video", video.id, {
      title: video.title,
      source: video.source,
    });

    return NextResponse.json({ ok: true, data: video }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    console.error("[videos POST]", e);
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
