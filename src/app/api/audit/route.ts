import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const sp = req.nextUrl.searchParams;
  const { skip, pageSize, page } = parsePagination(sp, 30);
  const q = sp.get("q") ?? undefined;
  const action = sp.get("action") ?? undefined;

  const where = {
    ...(action ? { action: action as never } : {}),
    ...(q ? {
      OR: [
        { actor: { email: { contains: q, mode: "insensitive" as const } } },
        { actor: { name: { contains: q, mode: "insensitive" as const } } },
        { action: { contains: q, mode: "insensitive" as const } },
      ]
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { name: true, email: true } },
        target: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return ok({ items, total, page, pageSize });
}
