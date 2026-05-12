import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole, canPublishDirectly } from "@/lib/rbac";
import { logAudit, AuditAction } from "@/lib/audit";

const VALID_TYPES = ["Announcement", "Video", "LibraryItem"] as const;

const submitSchema = z.object({
  contentType: z.enum(VALID_TYPES),
  contentId:   z.string().cuid(),
});

/**
 * POST /api/content/submit
 * Creators submit their draft content for review.
 * ADMIN+ can publish directly (skipping approval).
 */
export async function POST(req: NextRequest) {
  const guard = await requireRole("CREATOR");
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof submitSchema>;
  try {
    body = submitSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi dữ liệu" }, { status: 400 });
  }

  const { contentType, contentId } = body;

  // Verify the content belongs to this user (unless ADMIN+)
  let authorId: string | null = null;
  let currentStatus: string | null = null;

  if (contentType === "Announcement") {
    const item = await prisma.announcement.findUnique({
      where: { id: contentId },
      select: { authorId: true, contentStatus: true },
    });
    authorId = item?.authorId ?? null;
    currentStatus = item?.contentStatus ?? null;
  } else if (contentType === "Video") {
    const item = await prisma.video.findUnique({
      where: { id: contentId },
      select: { uploaderId: true, contentStatus: true },
    });
    authorId = item?.uploaderId ?? null;
    currentStatus = item?.contentStatus ?? null;
  } else if (contentType === "LibraryItem") {
    const item = await prisma.libraryItem.findUnique({
      where: { id: contentId },
      select: { uploaderId: true, contentStatus: true },
    });
    authorId = item?.uploaderId ?? null;
    currentStatus = item?.contentStatus ?? null;
  }

  if (!authorId) {
    return NextResponse.json({ ok: false, error: "Không tìm thấy nội dung" }, { status: 404 });
  }

  // Creators can only submit their own content
  if (guard.role === "CREATOR" && authorId !== guard.userId) {
    return NextResponse.json({ ok: false, error: "Bạn chỉ có thể gửi nội dung của mình" }, { status: 403 });
  }

  if (!["DRAFT", "REJECTED"].includes(currentStatus ?? "")) {
    return NextResponse.json(
      { ok: false, error: "Chỉ có thể gửi nội dung ở trạng thái DRAFT hoặc REJECTED" },
      { status: 400 }
    );
  }

  // ADMIN+ can publish directly
  if (canPublishDirectly(guard.role)) {
    const targetStatus = "PUBLISHED";

    if (contentType === "Announcement") {
      await prisma.announcement.update({ where: { id: contentId }, data: { contentStatus: "PUBLISHED", published: true } });
    } else if (contentType === "Video") {
      await prisma.video.update({ where: { id: contentId }, data: { contentStatus: "PUBLISHED" } });
    } else if (contentType === "LibraryItem") {
      await prisma.libraryItem.update({ where: { id: contentId }, data: { contentStatus: "PUBLISHED", isPublic: true } });
    }

    // Upsert approval record for history
    await prisma.contentApproval.create({
      data: {
        contentType,
        contentId,
        status:        "PUBLISHED",
        submittedById: guard.userId,
        reviewedById:  guard.userId,
        reviewedAt:    new Date(),
      },
    });

    await logAudit({
      req,
      userId:     guard.userId,
      actorRole:  guard.role,
      action:     AuditAction.CONTENT_PUBLISHED,
      entityType: contentType,
      entityId:   contentId,
      newValue:   { status: targetStatus },
    });

    return NextResponse.json({ ok: true, data: { status: targetStatus, directPublish: true } });
  }

  // Regular creator — submit for review
  await Promise.all([
    contentType === "Announcement"
      ? prisma.announcement.update({ where: { id: contentId }, data: { contentStatus: "SUBMITTED" } })
      : contentType === "Video"
        ? prisma.video.update({ where: { id: contentId }, data: { contentStatus: "SUBMITTED" } })
        : prisma.libraryItem.update({ where: { id: contentId }, data: { contentStatus: "SUBMITTED" } }),

    prisma.contentApproval.create({
      data: {
        contentType,
        contentId,
        status:        "SUBMITTED",
        submittedById: guard.userId,
      },
    }),
  ]);

  await logAudit({
    req,
    userId:     guard.userId,
    actorRole:  guard.role,
    action:     AuditAction.CONTENT_SUBMITTED,
    entityType: contentType,
    entityId:   contentId,
    newValue:   { status: "SUBMITTED" },
  });

  return NextResponse.json({ ok: true, data: { status: "SUBMITTED", directPublish: false } });
}
