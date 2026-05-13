import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  
  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return err("Not found", 404);

  // Authorization check
  const isOwner = existing.uploaderId === session.user.id;
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  if (!isOwner && !isAdmin) return err("Forbidden", 403);

  const body = await req.json();
  const video = await prisma.video.update({
    where: { id },
    data: body
  });

  await logAudit({
    action: "CONTENT_PUBLISHED",
    actorId: session.user.id,
    entity: "Video",
    entityId: id,
    detail: body,
    ipAddress: getClientIp(req),
  });

  return ok(video);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return err("Not found", 404);

  const isOwner = existing.uploaderId === session.user.id;
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);
  if (!isOwner && !isAdmin) return err("Forbidden", 403);

  await prisma.video.delete({ where: { id } });

  await logAudit({
    action: "CONTENT_DELETED",
    actorId: session.user.id,
    entity: "Video",
    entityId: id,
    ipAddress: getClientIp(req),
  });

  return ok({ deleted: true });
}
