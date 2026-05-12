import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const { skip, pageSize, page } = parsePagination(sp, 24);
  const courseId = sp.get("courseId") ?? undefined;
  const q = sp.get("q") ?? undefined;

  const where = {
    status: "PUBLISHED" as const,
    ...(courseId ? { courseId } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ]
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        course: { select: { name: true, slug: true } },
        bookmarks: { where: { userId: session.user.id }, select: { id: true } },
      },
    }),
    prisma.video.count({ where }),
  ]);

  const data = items.map(v => ({
    ...v,
    isBookmarked: v.bookmarks.length > 0,
    bookmarks: undefined,
  }));

  return ok({ items: data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { title, description, url, type, courseId, duration, thumbnailUrl } = body;

  if (!title?.trim() || !url?.trim()) return err("Thiếu thông tin bắt buộc");

  const video = await prisma.video.create({
    data: {
      title: title.trim(),
      description: description ?? "",
      url,
      type: type ?? "YOUTUBE",
      courseId: courseId ?? null,
      duration: duration ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      status: ["SUPER_ADMIN", "ADMIN"].includes(session.user.role) ? "PUBLISHED" : "DRAFT",
      uploaderId: session.user.id,
    },
  });

  return ok(video, 201);
}
