import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { ContentStatus } from "@prisma/client";

const VALID_STATUSES: ContentStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"];
const VALID_TYPES = ["Announcement", "Video", "LibraryItem"] as const;

export async function GET(req: NextRequest) {
  const guard = await requireRole("MODERATOR");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const status      = searchParams.get("status") as ContentStatus | null;
  const contentType = searchParams.get("type");
  const page        = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize    = 20;

  const where: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status)) where.status = status;
  if (contentType && VALID_TYPES.includes(contentType as (typeof VALID_TYPES)[number])) {
    where.contentType = contentType;
  }

  const [items, total] = await Promise.all([
    prisma.contentApproval.findMany({
      where,
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy:  { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contentApproval.count({ where }),
  ]);

  // Fetch the actual content for each approval record
  const enriched = await Promise.all(
    items.map(async (item) => {
      let content: Record<string, unknown> | null = null;
      try {
        if (item.contentType === "Announcement") {
          content = await prisma.announcement.findUnique({
            where: { id: item.contentId },
            select: { id: true, title: true, content: true, tag: true, contentStatus: true },
          }) as Record<string, unknown> | null;
        } else if (item.contentType === "Video") {
          content = await prisma.video.findUnique({
            where: { id: item.contentId },
            select: { id: true, title: true, description: true, subject: true, contentStatus: true },
          }) as Record<string, unknown> | null;
        } else if (item.contentType === "LibraryItem") {
          content = await prisma.libraryItem.findUnique({
            where: { id: item.contentId },
            select: { id: true, title: true, category: true, description: true, contentStatus: true },
          }) as Record<string, unknown> | null;
        }
      } catch {
        // content may have been deleted
      }
      return { ...item, content };
    })
  );

  return NextResponse.json({
    ok: true,
    data: { items: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}
