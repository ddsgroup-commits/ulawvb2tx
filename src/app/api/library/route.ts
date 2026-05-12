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
  const q = sp.get("q") ?? undefined;
  const tag = sp.get("tag") ?? undefined;

  const where = {
    status: "PUBLISHED" as const,
    ...(courseId ? { courseId } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ]
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.libraryItem.findMany({
      where,
      include: { course: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.libraryItem.count({ where }),
  ]);

  return ok({ items, total, page, pageSize });
}
