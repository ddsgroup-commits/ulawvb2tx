import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { logAudit, AuditAction } from "@/lib/audit";

const actionSchema = z.object({
  action:         z.enum(["approve", "reject", "request_revision"]),
  rejectionReason: z.string().optional(),
  revisionNote:   z.string().optional(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("MODERATOR");
  if (!guard.ok) return guard.response;

  const approval = await prisma.contentApproval.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy:  { select: { id: true, name: true } },
    },
  });
  if (!approval) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });

  return NextResponse.json({ ok: true, data: approval });
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("MODERATOR");
  if (!guard.ok) return guard.response;

  const approval = await prisma.contentApproval.findUnique({ where: { id } });
  if (!approval) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });

  if (approval.status !== "SUBMITTED") {
    return NextResponse.json(
      { ok: false, error: "Chỉ có thể xử lý nội dung ở trạng thái SUBMITTED" },
      { status: 400 }
    );
  }

  let body: z.infer<typeof actionSchema>;
  try {
    body = actionSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi dữ liệu" }, { status: 400 });
  }

  const { action, rejectionReason, revisionNote } = body;

  let newStatus: "APPROVED" | "REJECTED" | "SUBMITTED";
  let auditAction: string;

  if (action === "approve") {
    newStatus = "APPROVED";
    auditAction = AuditAction.CONTENT_APPROVED;
  } else if (action === "reject") {
    if (!rejectionReason?.trim()) {
      return NextResponse.json({ ok: false, error: "Vui lòng cung cấp lý do từ chối" }, { status: 400 });
    }
    newStatus = "REJECTED";
    auditAction = AuditAction.CONTENT_REJECTED;
  } else {
    // request_revision — keep SUBMITTED but add note
    newStatus = "SUBMITTED";
    auditAction = AuditAction.CONTENT_SUBMITTED;
  }

  const updated = await prisma.contentApproval.update({
    where: { id },
    data: {
      status:          newStatus,
      reviewedById:    guard.userId,
      reviewedAt:      new Date(),
      rejectionReason: rejectionReason ?? null,
      revisionNote:    revisionNote ?? null,
    },
  });

  // Sync contentStatus on the actual content model
  const targetStatus = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "SUBMITTED";
  try {
    if (approval.contentType === "Announcement") {
      await prisma.announcement.update({
        where: { id: approval.contentId },
        data: { contentStatus: targetStatus },
      });
    } else if (approval.contentType === "Video") {
      await prisma.video.update({
        where: { id: approval.contentId },
        data: { contentStatus: targetStatus },
      });
    } else if (approval.contentType === "LibraryItem") {
      await prisma.libraryItem.update({
        where: { id: approval.contentId },
        data: { contentStatus: targetStatus },
      });
    }
  } catch {
    // content deleted — approval record stays for history
  }

  await logAudit({
    req,
    userId:     guard.userId,
    actorRole:  guard.role,
    action:     auditAction,
    entityType: approval.contentType,
    entityId:   approval.contentId,
    oldValue:   { status: "SUBMITTED" },
    newValue:   { status: newStatus, reason: rejectionReason },
  });

  return NextResponse.json({ ok: true, data: updated });
}

// Allow ADMIN to publish approved content
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const guard = await requireRole("ADMIN");
  if (!guard.ok) return guard.response;

  const approval = await prisma.contentApproval.findUnique({ where: { id } });
  if (!approval) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });

  if (approval.status !== "APPROVED") {
    return NextResponse.json(
      { ok: false, error: "Chỉ nội dung đã được duyệt mới có thể đăng" },
      { status: 400 }
    );
  }

  const updated = await prisma.contentApproval.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  try {
    if (approval.contentType === "Announcement") {
      await prisma.announcement.update({
        where: { id: approval.contentId },
        data: { contentStatus: "PUBLISHED", published: true },
      });
    } else if (approval.contentType === "Video") {
      await prisma.video.update({
        where: { id: approval.contentId },
        data: { contentStatus: "PUBLISHED" },
      });
    } else if (approval.contentType === "LibraryItem") {
      await prisma.libraryItem.update({
        where: { id: approval.contentId },
        data: { contentStatus: "PUBLISHED", isPublic: true },
      });
    }
  } catch {
    // content deleted
  }

  await logAudit({
    req,
    userId:     guard.userId,
    actorRole:  guard.role,
    action:     AuditAction.CONTENT_PUBLISHED,
    entityType: approval.contentType,
    entityId:   approval.contentId,
    newValue:   { status: "PUBLISHED" },
  });

  return NextResponse.json({ ok: true, data: updated });
}
