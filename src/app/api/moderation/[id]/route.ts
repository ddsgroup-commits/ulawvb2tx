import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(session.user.role)) return err("Forbidden", 403);

  const { id } = await params;
  const { action, note, entity } = await req.json();
  const ip = getClientIp(req);

  // Determine new status
  let newStatus: string;
  let auditAction: "CONTENT_APPROVED" | "CONTENT_REJECTED" = "CONTENT_APPROVED";
  if (action === "approve") {
    newStatus = "APPROVED";
    auditAction = "CONTENT_APPROVED";
  } else if (action === "reject" || action === "request_revision") {
    newStatus = "REJECTED";
    auditAction = "CONTENT_REJECTED";
  } else {
    return err("Invalid action");
  }

  const noteVal = note?.trim() ?? null;

  // Try to find the entity in each table
  let found = false;
  let entityName = "unknown";

  const annc = await prisma.announcement.findUnique({ where: { id } });
  if (annc) {
    await prisma.announcement.update({
      where: { id },
      data: {
        status: newStatus as never,
        note: noteVal,
        published: newStatus === "APPROVED",
        publishAt: newStatus === "APPROVED" ? new Date() : annc.publishAt,
      },
    });
    found = true;
    entityName = "Announcement";
  }

  if (!found) {
    const video = await prisma.video.findUnique({ where: { id } });
    if (video) {
      await prisma.video.update({
        where: { id },
        data: { status: newStatus as never, note: noteVal },
      });
      found = true;
      entityName = "Video";
    }
  }

  if (!found) {
    const lib = await prisma.libraryItem.findUnique({ where: { id } });
    if (lib) {
      await prisma.libraryItem.update({
        where: { id },
        data: { status: newStatus as never, note: noteVal },
      });
      found = true;
      entityName = "LibraryItem";
    }
  }

  if (!found) return err("Entity not found", 404);

  await logAudit({
    action: auditAction,
    actorId: session.user.id,
    entityId: id,
    entity: entityName,
    detail: { newStatus, note: noteVal },
    ipAddress: ip,
  });

  return ok({ id, status: newStatus });
}
