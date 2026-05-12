import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const { email, role, note } = await req.json();
  if (!email?.trim() || !role) return err("Thiếu thông tin bắt buộc");

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      email: email.toLowerCase().trim(),
      role,
      token,
      note: note ?? null,
      expiresAt,
      invitedById: session.user.id,
    },
  });

  await logAudit({
    action: "USER_CREATED",
    actorId: session.user.id,
    detail: { email, role, type: "invitation" },
    ipAddress: getClientIp(req),
  });

  // In production, send email with invitation link
  const inviteUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/register?token=${token}`;

  return ok({ invitation, inviteUrl }, 201);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const invitations = await prisma.invitation.findMany({
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return ok(invitations);
}
