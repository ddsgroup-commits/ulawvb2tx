import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, parsePagination } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const sp = req.nextUrl.searchParams;
  const { skip, pageSize, page } = parsePagination(sp, 30);
  const q = sp.get("q") ?? undefined;
  const role = sp.get("role") ?? undefined;
  const status = sp.get("status") ?? undefined;

  const where = {
    ...(role ? { role: role as never } : {}),
    ...(status === "pending" ? { role: "PENDING_USER" as never } : {}),
    ...(status === "active" ? { isActive: true, NOT: { role: "PENDING_USER" as never } } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ]
    } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        createdAt: true, googleLinked: true,
        profile: { select: { mssv: true, phone: true } },
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return ok({ items: users, total, page, pageSize });
}
