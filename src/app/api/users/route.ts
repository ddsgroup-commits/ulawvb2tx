import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole, canManageUsers } from "@/lib/rbac";
import { logAudit, AuditAction } from "@/lib/audit";
import type { Role } from "@prisma/client";

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "STUDENT", "PENDING_USER"] as const;

export async function GET(req: NextRequest) {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q        = searchParams.get("q") ?? "";
  const role     = searchParams.get("role") as Role | null;
  const active   = searchParams.get("active");
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") ?? 50)));

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name:      { contains: q, mode: "insensitive" } },
      { email:     { contains: q, mode: "insensitive" } },
      { studentId: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    where.role = role;
  }
  if (active === "true")  where.isActive = true;
  if (active === "false") where.isActive = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, studentId: true, createdAt: true,
        mustChangePassword: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    data: { items: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}

const createSchema = z.object({
  name:      z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  role:      z.enum(VALID_ROLES).optional().default("STUDENT"),
  studentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  if (!canManageUsers(guard.role)) {
    return NextResponse.json({ ok: false, error: "Không đủ quyền tạo tài khoản" }, { status: 403 });
  }

  try {
    const data = createSchema.parse(await req.json());

    // Only SUPER_ADMIN can create SUPER_ADMIN
    if (data.role === "SUPER_ADMIN" && guard.role !== "SUPER_ADMIN") {
      return NextResponse.json({ ok: false, error: "Chỉ SUPER_ADMIN mới có thể tạo tài khoản SUPER_ADMIN" }, { status: 403 });
    }

    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hash,
        role: data.role,
        studentId: data.studentId,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await logAudit({
      req,
      userId:     guard.userId,
      actorRole:  guard.role,
      action:     AuditAction.USER_CREATED,
      entityType: "User",
      entityId:   user.id,
      newValue:   { role: user.role, email: user.email },
    });

    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    const msg = (e as Error).message;
    if (msg.includes("Unique constraint"))
      return NextResponse.json({ ok: false, error: "Email hoặc MSSV đã tồn tại" }, { status: 409 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
