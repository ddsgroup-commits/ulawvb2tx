import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(session.user.role)) return err("Forbidden", 403);

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const where = status ? { status: status as never } : {};

  // Query announcements, videos, library items with pending status
  const [announcements, videos, libraryItems] = await Promise.all([
    prisma.announcement.findMany({
      where: { ...where, published: false },
      select: {
        id: true, title: true, status: true, courseId: true, createdAt: true, note: true,
        author: { select: { name: true, email: true } },
        course: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.video.findMany({
      where,
      select: {
        id: true, title: true, status: true, courseId: true, createdAt: true, note: true,
        uploader: { select: { name: true, email: true } },
        course: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.libraryItem.findMany({
      where,
      select: {
        id: true, title: true, status: true, courseId: true, createdAt: true, note: true,
        uploader: { select: { name: true, email: true } },
        course: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const queue = [
    ...announcements.map(a => ({
      id: a.id,
      entity: "Announcement" as const,
      entityId: a.id,
      title: a.title,
      submittedBy: a.author?.name ?? a.author?.email ?? "Unknown",
      submittedAt: a.createdAt.toISOString(),
      status: a.status as string,
      courseId: a.courseId,
      courseName: a.course?.name ?? null,
      note: a.note,
    })),
    ...videos.map(v => ({
      id: v.id,
      entity: "Video" as const,
      entityId: v.id,
      title: v.title,
      submittedBy: v.uploader?.name ?? v.uploader?.email ?? "Unknown",
      submittedAt: v.createdAt.toISOString(),
      status: v.status as string,
      courseId: v.courseId,
      courseName: v.course?.name ?? null,
      note: v.note,
    })),
    ...libraryItems.map(l => ({
      id: l.id,
      entity: "LibraryItem" as const,
      entityId: l.id,
      title: l.title,
      submittedBy: l.uploader?.name ?? l.uploader?.email ?? "Unknown",
      submittedAt: l.createdAt.toISOString(),
      status: l.status as string,
      courseId: l.courseId,
      courseName: l.course?.name ?? null,
      note: l.note,
    })),
  ].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  return ok(queue);
}
