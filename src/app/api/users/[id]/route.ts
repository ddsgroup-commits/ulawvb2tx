import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { role, isActive, action } = body;
  const ip = getClientIp(req);

  // Handle approval action
  if (action === "approve") {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role: role ?? "STUDENT", isActive: true },
    });
    await logAudit({ action: "USER_APPROVED", actorId: session.user.id, targetId: params.id, ipAddress: ip });
    return ok(user);
  }

  if (action === "reject") {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    await logAudit({ action: "USER_REJECTED", actorId: session.user.id, targetId: params.id, ipAddress: ip });
    return ok(user);
  }

  if (action === "deactivate") {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    await logAudit({ action: "USER_DEACTIVATED", actorId: session.user.id, targetId: params.id, ipAddress: ip });
    return ok(user);
  }

  // Generic update
  const updated: Record<string, unknown> = {};
  if (role !== undefined) updated.role = role;
  if (isActive !== undefined) updated.isActive = isActive;

  const user = await prisma.user.update({ where: { id: params.id }, data: updated });

  if (role !== undefined) {
    await logAudit({
      action: "USER_ROLE_CHANGED",
      actorId: session.user.id,
      targetId: params.id,
      detail: { newRole: role },
      ipAddress: ip,
    });
  }

  return ok(user);
}
