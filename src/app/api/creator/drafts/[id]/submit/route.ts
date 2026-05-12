import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const ip = getClientIp(req);

  // Try each entity type
  let found = false;

  const annc = await prisma.announcement.findUnique({ where: { id: params.id, authorId: session.user.id } });
  if (annc) {
    if (!["DRAFT", "REJECTED"].includes(annc.status)) return err("Không thể nộp duyệt ở trạng thái này");
    await prisma.announcement.update({ where: { id: params.id }, data: { status: "SUBMITTED" } });
    found = true;
  }

  if (!found) {
    const video = await prisma.video.findUnique({ where: { id: params.id, uploaderId: session.user.id } });
    if (video) {
      if (!["DRAFT", "REJECTED"].includes(video.status)) return err("Không thể nộp duyệt ở trạng thái này");
      await prisma.video.update({ where: { id: params.id }, data: { status: "SUBMITTED" } });
      found = true;
    }
  }

  if (!found) {
    const lib = await prisma.libraryItem.findUnique({ where: { id: params.id, uploaderId: session.user.id } });
    if (lib) {
      if (!["DRAFT", "REJECTED"].includes(lib.status)) return err("Không thể nộp duyệt ở trạng thái này");
      await prisma.libraryItem.update({ where: { id: params.id }, data: { status: "SUBMITTED" } });
      found = true;
    }
  }

  if (!found) return err("Không tìm thấy bản nháp", 404);

  await logAudit({
    action: "CONTENT_SUBMITTED",
    actorId: session.user.id,
    entityId: params.id,
    ipAddress: ip,
  });

  return ok({ submitted: true });
}
