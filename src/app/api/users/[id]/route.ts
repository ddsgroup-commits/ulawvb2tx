import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole, canManageUser, canChangeRole } from "@/lib/rbac";
import { logAudit, AuditAction } from "@/lib/audit";
import type { Role } from "@prisma/client";

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "STUDENT", "PENDING_USER"] as const;

const updateSchema = z.object({
  name:      z.string().min(1).optional(),
  role:      z.enum(VALID_ROLES).optional(),
  isActive:  z.boolean().optional(),
  studentId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, studentId: true, createdAt: true,
      mustChangePassword: true, phone: true, bio: true,
    },
  });
  if (!user) return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng" }, { status: 404 });

  return NextResponse.json({ ok: true, data: user });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
  if (!target) return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng" }, { status: 404 });

  // Prevent managing higher-ranked users
  if (!canManageUser(guard.role, target.role as Role)) {
    return NextResponse.json(
      { ok: false, error: "Không thể thay đổi tài khoản có cấp bậc cao hơn hoặc bằng bạn" },
      { status: 403 }
    );
  }

  try {
    const data = updateSchema.parse(await req.json());

    // Role change validation
    if (data.role && data.role !== target.role) {
      if (!canChangeRole(guard.role, target.role as Role, data.role)) {
        return NextResponse.json(
          { ok: false, error: "Không có quyền thay đổi vai trò này" },
          { status: 403 }
        );
      }
    }

    const oldRole = target.role;
    const oldActive = target.isActive;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    // Audit role change
    if (data.role && data.role !== oldRole) {
      await logAudit({
        req,
        userId:     guard.userId,
        actorRole:  guard.role,
        action:     AuditAction.ROLE_CHANGED,
        entityType: "User",
        entityId:   id,
        oldValue:   { role: oldRole },
        newValue:   { role: data.role },
      });
    }

    // Audit active toggle
    if (data.isActive !== undefined && data.isActive !== oldActive) {
      await logAudit({
        req,
        userId:     guard.userId,
        actorRole:  guard.role,
        action:     data.isActive ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
        entityType: "User",
        entityId:   id,
        oldValue:   { isActive: oldActive },
        newValue:   { isActive: data.isActive },
      });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("SUPER_ADMIN");
  if (!guard.ok) return guard.response;

  if (id === guard.userId) {
    return NextResponse.json({ ok: false, error: "Không thể tự xóa tài khoản của mình" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!target) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  await logAudit({
    req,
    userId:     guard.userId,
    actorRole:  guard.role,
    action:     AuditAction.USER_DELETED,
    entityType: "User",
    entityId:   id,
    oldValue:   { role: target.role, email: target.email },
  });

  return NextResponse.json({ ok: true, data: null });
}
