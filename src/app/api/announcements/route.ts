import prisma from "@/lib/prisma";
import { apiHandler, ok, paginated } from "@/lib/api";
import { announcementCreateSchema, paginationSchema } from "@/lib/validation";
import { PERMISSIONS } from "@/lib/permissions";
import { notifyMany } from "@/lib/notifications";
import { z } from "zod";

const listQuery = paginationSchema.extend({
  tag: z.string().optional(),
  pinned: z.coerce.boolean().optional(),
  courseId: z.string().optional(),
});

/** GET /api/announcements — published list, filterable. Auth required. */
export const GET = apiHandler({
  auth: "required",
  query: listQuery,
  handler: async ({ query }) => {
    const where: any = { published: true };
    if (query.tag) where.tag = query.tag;
    if (query.pinned !== undefined) where.pinned = query.pinned;
    if (query.courseId) where.courseId = query.courseId;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { content: { contains: query.q, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          author: { select: { name: true, image: true, role: true } },
          course: { select: { code: true, name: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);
    return paginated(items, { page: query.page, pageSize: query.pageSize, total });
  },
});

/** POST — admin/lecturer create, then fan-out notifications. */
export const POST = apiHandler({
  auth: "required",
  permission: PERMISSIONS.ANNOUNCEMENTS_MANAGE,
  body: announcementCreateSchema,
  handler: async ({ session, body }) => {
    const authorId = session!.user!.id as string;

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        tag: body.tag,
        courseId: body.courseId || null,
        pinned: body.pinned,
        urgent: body.urgent,
        publishAt: body.publishAt ?? null,
        expiresAt: body.expiresAt ?? null,
        authorId,
        status: "PUBLISHED",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: authorId,
        action: "CONTENT_PUBLISHED",
        entity: "Announcement",
        entityId: announcement.id,
        detail: { title: announcement.title, urgent: announcement.urgent, tag: announcement.tag },
      },
    });

    const recipients = await prisma.user.findMany({
      where: { isActive: true, role: { not: "PENDING_USER" }, id: { not: authorId } },
      select: { id: true },
    });

    if (recipients.length > 0) {
      await notifyMany({
        userIds: recipients.map((r) => r.id),
        type: "ANNOUNCEMENT",
        title: announcement.urgent ? `🚨 ${announcement.title}` : announcement.title,
        body: announcement.content.slice(0, 200),
        link: `/portal/announcements/${announcement.id}`,
        entity: "Announcement",
        entityId: announcement.id,
      });
    }

    return ok(announcement, 201);
  },
});
