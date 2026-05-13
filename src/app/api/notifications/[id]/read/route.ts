import prisma from "@/lib/prisma";
import { apiHandler, ok, err } from "@/lib/api";
import { idSchema } from "@/lib/validation";

/** POST /api/notifications/:id/read — mark a single notification read. */
export const POST = apiHandler({
  auth: "required",
  params: idSchema,
  handler: async ({ session, params }) => {
    const userId = session!.user!.id as string;
    const notif = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notif || notif.userId !== userId) return err("Not found", 404);
    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true, readAt: new Date() },
    });
    return ok(updated);
  },
});
