/**
 * /api/invite/[token]
 * GET  — validate token (public, for the accept-invite page)
 * POST — accept invitation: set name + password, create user account
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ── GET (validate token) ─────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invite = await prisma.adminInvitation.findUnique({
    where: { token },
    include: { inviter: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ ok: false, error: "Link mời không hợp lệ" }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ ok: false, error: "Link mời đã được sử dụng" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Link mời đã hết hạn" }, { status: 410 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      email:       invite.email,
      role:        invite.role,
      inviterName: invite.inviter.name,
      note:        invite.note,
      expiresAt:   invite.expiresAt,
    },
  });
}

// ── POST (accept invitation) ─────────────────────────────────
const AcceptSchema = z.object({
  name:     z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  studentId: z.string().max(20).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invite = await prisma.adminInvitation.findUnique({ where: { token } });
  if (!invite)      return NextResponse.json({ ok: false, error: "Link không hợp lệ" },    { status: 404 });
  if (invite.usedAt) return NextResponse.json({ ok: false, error: "Đã được sử dụng" },     { status: 410 });
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Link đã hết hạn" }, { status: 410 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, password, studentId } = parsed.data;

  // Double-check email isn't already taken
  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Email này đã có tài khoản" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email:        invite.email,
      passwordHash,
      role:         invite.role,
      studentId:    studentId || null,
      isActive:     true,
    },
  });

  // Mark invitation as used
  await prisma.adminInvitation.update({
    where: { id: invite.id },
    data:  { usedAt: new Date() },
  });

  await logAudit(req, user.id, "ACCEPT_INVITATION", "User", user.id, {
    email: user.email, role: user.role,
  });

  return NextResponse.json({ ok: true, data: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
}
