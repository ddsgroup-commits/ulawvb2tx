import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, slugify } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const { id } = await params;
  const body = await req.json();
  
  const course = await prisma.course.update({
    where: { id },
    data: {
      ...body,
      ...(body.name ? { slug: slugify(body.name) } : {}),
      ...(body.credits ? { credits: parseInt(body.credits) } : {})
    }
  });

  await logAudit({
    action: "CONTENT_PUBLISHED",
    actorId: session.user.id,
    entity: "Course",
    entityId: course.id,
    detail: body,
    ipAddress: getClientIp(req),
  });

  return ok(course);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(session.user.role)) return err("Forbidden", 403);

  const { id } = await params;

  await prisma.course.delete({ where: { id } });

  await logAudit({
    action: "CONTENT_DELETED",
    actorId: session.user.id,
    entity: "Course",
    entityId: id,
    ipAddress: getClientIp(req),
  });

  return ok({ deleted: true });
}
