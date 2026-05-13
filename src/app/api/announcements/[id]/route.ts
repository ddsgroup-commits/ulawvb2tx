import prisma from "@/lib/prisma";
import { apiHandler, ok, err } from "@/lib/api";
import { announcementUpdateSchema, idSchema } from "@/lib/validation";
import { PERMISSIONS } from "@/lib/permissions";

export const GET = apiHandler({
  auth: "required",
  params: idSchema,
  handler: async ({ params }) => {
    const item = await prisma.announcement.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { name: true, image: true, role: true } },
        course: { select: { code: true, name: true } },
      },
    });
    if (!item) return err("Not found", 404);
    return ok(item);
  },
});

export const PATCH = apiHandler({
  auth: "required",
  permission: PERMISSIONS.ANNOUNCEMENTS_MANAGE,
  params: idSchema,
  body: announcementUpdateSchema,
  handler: async ({ session, params, body }) => {
    const updated = await prisma.announcement.update({
      where: { id: params.id },
      data: body as any,
    });
    await prisma.auditLog.create({
      data: {
        actorId: session!.user!.id as string,
        action: "CONTENT_PUBLISHED",
        entity: "Announcement",
        entityId: updated.id,
        detail: { fields: Object.keys(body) },
      },
    });
    return ok(updated);
  },
});

export const DELETE = apiHandler({
  auth: "required",
  permission: PERMISSIONS.CONTENT_DELETE,
  params: idSchema,
  handler: async ({ session, params }) => {
    await prisma.announcement.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: {
        actorId: session!.user!.id as string,
        action: "CONTENT_DELETED",
        entity: "Announcement",
        entityId: params.id,
      },
    });
    return ok({ deleted: true });
  },
});
