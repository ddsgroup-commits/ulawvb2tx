/**
 * /api/invitations/[id]
 * DELETE — revoke/delete an invitation (ADMIN+)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as Role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const invite = await prisma.adminInvitation.findUnique({ where: { id } });
  if (!invite) {
    return NextResponse.json({ ok: false, error: "Không tìm thấy lời mời" }, { status: 404 });
  }

  await prisma.adminInvitation.delete({ where: { id } });
  await logAudit(req, session.user.id, "DELETE_INVITATION", "AdminInvitation", id, {
    email: invite.email,
  });

  return NextResponse.json({ ok: true });
}
