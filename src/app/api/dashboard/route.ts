import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const now = new Date();

  const [
    announcements, events, courses, videos,
    config, totalUsers
  ] = await Promise.all([
    prisma.announcement.findMany({
      where: { published: true, publishAt: { lte: now } },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 5,
      select: { id: true, title: true, tags: true, pinned: true, publishAt: true },
    }),
    prisma.event.findMany({
      where: { startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 8,
      include: { course: { select: { name: true, slug: true, color: true } } },
    }),
    prisma.course.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true, name: true, slug: true, code: true, status: true,
        color: true, icon: true,
        lecturer: { select: { name: true } },
        notebooklmUrl: true,
        driveUrl: true,
      },
    }),
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { course: { select: { name: true, slug: true } } },
    }),
    prisma.siteConfig.findFirst(),
    prisma.user.count({ where: { isActive: true, role: { not: "PENDING_USER" } } }),
  ]);

  const stats = {
    activeCourses: courses.filter(c => c.status === "ACTIVE").length,
    upcomingExams: events.filter(e => e.isExam).length,
    upcomingDeadlines: events.filter(e => e.type === "DEADLINE").length,
    unreadAnnouncements: announcements.length,
    totalUsers,
  };

  return ok({ announcements, events, courses, videos, config, stats });
}
