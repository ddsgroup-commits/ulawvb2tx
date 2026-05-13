import prisma from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";

/** POST /api/notifications/read-all — mark every unread row read for the user. */
export const POST = apiHandler({
  auth: "required",
  handler: async ({ session }) => {
    const userId = session!.user!.id as string;
    const { count } = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return ok({ updated: count });
  },
});
