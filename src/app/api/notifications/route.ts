import prisma from "@/lib/prisma";
import { apiHandler, ok, paginated } from "@/lib/api";
import { paginationSchema } from "@/lib/validation";

/** GET /api/notifications — list for current user (paginated). */
export const GET = apiHandler({
  auth: "required",
  query: paginationSchema,
  handler: async ({ session, query }) => {
    const userId = session!.user!.id as string;
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return ok({ items, unread, page: query.page, pageSize: query.pageSize, total });
  },
});
