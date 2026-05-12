/**
 * /api/audit
 * GET — paginated audit log with filters (ADMIN+)
 * Query params:
 *   page, pageSize, userId, action, entityType, from, to
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, Prisma } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as Role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page       = Math.max(1,  Number(searchParams.get("page")     ?? "1"));
  const pageSize   = Math.min(100, Number(searchParams.get("pageSize") ?? "50"));
  const userId     = searchParams.get("userId")     ?? undefined;
  const action     = searchParams.get("action")     ?? undefined;
  const entityType = searchParams.get("entityType") ?? undefined;
  const from       = searchParams.get("from")       ?? undefined;
  const to         = searchParams.get("to")         ?? undefined;

  const where: Prisma.AuditLogWhereInput = {};
  if (userId)     where.userId     = userId;
  if (action)     where.action     = { contains: action, mode: "insensitive" };
  if (entityType) where.entityType = entityType;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
