import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { logAudit, AuditAction } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  note:   z.string().optional(),
});

/**
 * POST /api/users/[id]/approve
 * Approve or reject a PENDING_USER.
 * Approval promotes to STUDENT. Rejection deactivates the account.
 */
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true, email: true, name: true },
  });
  if (!target) return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng" }, { status: 404 });

  if (target.role !== "PENDING_USER") {
    return NextResponse.json(
      { ok: false, error: "Chỉ có thể duyệt tài khoản đang ở trạng thái PENDING_USER" },
      { status: 400 }
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi dữ liệu" }, { status: 400 });
  }

  const { action, note } = body;

  if (action === "approve") {
    await prisma.user.update({
      where: { id },
      data: { role: "STUDENT", isActive: true },
    });
    await logAudit({
      req,
      userId:     guard.userId,
      actorRole:  guard.role,
      action:     AuditAction.USER_APPROVED,
      entityType: "User",
      entityId:   id,
      oldValue:   { role: "PENDING_USER" },
      newValue:   { role: "STUDENT" },
      meta:       note ? { note } : undefined,
    });
    return NextResponse.json({ ok: true, data: { role: "STUDENT", isActive: true } });
  } else {
    // Reject: deactivate the account and keep role as PENDING_USER
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    await logAudit({
      req,
      userId:     guard.userId,
      actorRole:  guard.role,
      action:     AuditAction.USER_REJECTED,
      entityType: "User",
      entityId:   id,
      oldValue:   { isActive: true },
      newValue:   { isActive: false },
      meta:       note ? { note } : undefined,
    });
    return NextResponse.json({ ok: true, data: { role: "PENDING_USER", isActive: false } });
  }
}
