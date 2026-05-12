import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const { skip, pageSize, page } = parsePagination(sp, 20);
  const tag = sp.get("tag") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const pinned = sp.get("pinned");

  const where = {
    published: true,
    publishAt: { lte: new Date() },
    ...(tag ? { tags: { has: tag } } : {}),
    ...(pinned === "true" ? { pinned: true } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { body: { contains: q, mode: "insensitive" as const } },
      ]
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.announcement.count({ where }),
  ]);

  return ok({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const role = session.user.role;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) return err("Forbidden", 403);

  const body = await req.json();
  const { title, body: content, tags, pinned, publishAt, courseId } = body;

  if (!title?.trim()) return err("Tiêu đề không được trống");

  const item = await prisma.announcement.create({
    data: {
      title: title.trim(),
      body: content ?? "",
      tags: tags ?? [],
      pinned: pinned ?? false,
      published: true,
      publishAt: publishAt ? new Date(publishAt) : new Date(),
      courseId: courseId ?? null,
      authorId: session.user.id,
    },
  });

  return ok(item, 201);
}
