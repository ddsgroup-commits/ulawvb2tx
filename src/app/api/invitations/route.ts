/**
 * /api/invitations
 * GET  — list all pending invitations (ADMIN+)
 * POST — create & send invitation (ADMIN+)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendMail, invitationEmailHtml } from "@/lib/email";
import { z } from "zod";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

const CreateSchema = z.object({
  email:     z.string().email(),
  role:      z.enum(["ADMIN", "MODERATOR", "CREATOR", "STUDENT"]),
  note:      z.string().max(500).optional(),
  expiresIn: z.number().min(1).max(30).optional().default(7), // days
});

// ── GET ──────────────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as Role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  const invitations = await prisma.adminInvitation.findMany({
    include: { inviter: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data: invitations });
}

// ── POST ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as Role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 });
  }

  const { email, role, note, expiresIn } = parsed.data;

  // Check if email already has an account
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Email này đã có tài khoản trong hệ thống." },
      { status: 409 },
    );
  }

  // Check for existing pending (unused + not expired) invitation
  const existingInvite = await prisma.adminInvitation.findFirst({
    where: {
      email,
      usedAt:    null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return NextResponse.json(
      { ok: false, error: "Email này đã có lời mời đang chờ xác nhận." },
      { status: 409 },
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresIn);

  const invitation = await prisma.adminInvitation.create({
    data: {
      email,
      role:        role as Role,
      note,
      expiresAt,
      invitedById: session.user.id,
    },
  });

  // Build invite URL
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

  // Send email
  await sendMail({
    to:      email,
    subject: "Bạn được mời tham gia ULAW VB2 Portal",
    html:    invitationEmailHtml({
      inviterName: session.user.name ?? "Admin",
      role,
      inviteUrl,
      expiresAt,
      note,
    }),
  });

  await logAudit(req, session.user.id, "CREATE_INVITATION", "AdminInvitation", invitation.id, {
    email, role,
  });

  return NextResponse.json({ ok: true, data: { ...invitation, inviteUrl } }, { status: 201 });
}
