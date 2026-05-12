import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseVideoUrl } from "@/lib/video";

// ── GET /api/videos/[id] ──────────────────────────────────────
// Returns the video and increments viewCount when called from a
// "watch" page. Pass ?view=1 to count the view.
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }

  const url = new URL(req.url);
  const shouldCountView = url.searchParams.get("view") === "1";

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true, slug: true } },
      uploader: { select: { name: true } },
    },
  });
  if (!video) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });

  // Hide unpublished from non-admins.
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role);
  if (!isAdmin && video.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }

  if (shouldCountView) {
    await prisma.video.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  }

  return NextResponse.json({ ok: true, data: video });
}

const updateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  subject: z.string().max(120).optional().nullable(),
  courseId: z.string().optional().nullable(),
  lecturer: z.string().max(120).optional().nullable(),
  classDate: z.string().datetime().or(z.string().min(8)).optional().nullable(),
  url: z.string().url().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  relatedDocs: z.array(z.string().url()).max(20).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = updateSchema.parse(await req.json());

    // If URL changes, re-derive source/embed/thumbnail.
    const urlDerived = data.url ? parseVideoUrl(data.url) : null;

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.subject !== undefined ? { subject: data.subject } : {}),
        ...(data.courseId !== undefined ? { courseId: data.courseId || null } : {}),
        ...(data.lecturer !== undefined ? { lecturer: data.lecturer } : {}),
        ...(data.classDate !== undefined
          ? { classDate: data.classDate ? new Date(data.classDate) : null }
          : {}),
        ...(data.url !== undefined && urlDerived
          ? {
              url: data.url,
              source: urlDerived.source,
              embedUrl: urlDerived.embedUrl,
              thumbnailUrl: urlDerived.thumbnailUrl,
            }
          : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.relatedDocs !== undefined ? { relatedDocs: data.relatedDocs } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.pinned !== undefined ? { pinned: data.pinned } : {}),
      },
    });

    await logAudit(req, session.user.id, "UPDATE_VIDEO", "Video", video.id);
    return NextResponse.json({ ok: true, data: video });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    console.error("[videos PATCH]", e);
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
    await prisma.video.delete({ where: { id } });
    await logAudit(req, session.user.id, "DELETE_VIDEO", "Video", id);
    return NextResponse.json({ ok: true, data: null });
  } catch {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }
}
