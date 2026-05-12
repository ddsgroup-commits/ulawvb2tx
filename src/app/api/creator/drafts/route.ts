import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(session.user.role)) return err("Forbidden", 403);

  const [announcements, videos, library] = await Promise.all([
    prisma.announcement.findMany({
      where: { authorId: session.user.id, published: false },
      select: {
        id: true, title: true, status: true, note: true, courseId: true,
        createdAt: true, updatedAt: true,
        course: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.video.findMany({
      where: { uploaderId: session.user.id, status: { not: "PUBLISHED" } },
      select: {
        id: true, title: true, status: true, note: true, courseId: true,
        createdAt: true, updatedAt: true,
        course: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.libraryItem.findMany({
      where: { uploaderId: session.user.id, status: { not: "PUBLISHED" } },
      select: {
        id: true, title: true, status: true, note: true, courseId: true,
        createdAt: true, updatedAt: true,
        course: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const drafts = [
    ...announcements.map(a => ({
      id: a.id, type: "announcement" as const, title: a.title, status: a.status,
      courseName: a.course?.name ?? null, note: a.note,
      createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
    })),
    ...videos.map(v => ({
      id: v.id, type: "video" as const, title: v.title, status: v.status,
      courseName: v.course?.name ?? null, note: v.note,
      createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString(),
    })),
    ...library.map(l => ({
      id: l.id, type: "library" as const, title: l.title, status: l.status,
      courseName: l.course?.name ?? null, note: l.note,
      createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString(),
    })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return ok(drafts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(session.user.role)) return err("Forbidden", 403);

  const { type, title, body, url, courseId } = await req.json();
  if (!title?.trim()) return err("Tiêu đề không được trống");

  let result;
  if (type === "announcement") {
    result = await prisma.announcement.create({
      data: { title, body: body ?? "", authorId: session.user.id, courseId: courseId ?? null, status: "DRAFT", published: false, tags: [] },
    });
  } else if (type === "video") {
    result = await prisma.video.create({
      data: { title, url: url ?? "", uploaderId: session.user.id, courseId: courseId ?? null, status: "DRAFT", type: "YOUTUBE" },
    });
  } else if (type === "library") {
    result = await prisma.libraryItem.create({
      data: { title, uploaderId: session.user.id, courseId: courseId ?? null, status: "DRAFT", fileType: "link", tags: [] },
    });
  } else {
    return err("Invalid type");
  }

  return ok(result, 201);
}
