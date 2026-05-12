import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const { skip, pageSize, page } = parsePagination(sp, 20);
  const courseId = sp.get("courseId") ?? undefined;

  const where = { ...(courseId ? { courseId } : {}) };

  const [items, total] = await Promise.all([
    prisma.discussion.findMany({
      where,
      include: {
        author: { select: { name: true, role: true } },
        course: { select: { name: true, slug: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.discussion.count({ where }),
  ]);

  return ok({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const { title, body, courseId } = await req.json();
  if (!title?.trim() || !body?.trim()) return err("Thiếu tiêu đề hoặc nội dung");

  const disc = await prisma.discussion.create({
    data: {
      title: title.trim(),
      body: body.trim(),
      courseId: courseId ?? null,
      authorId: session.user.id,
    },
    include: {
      author: { select: { name: true, role: true } },
    },
  });

  return ok(disc, 201);
}
