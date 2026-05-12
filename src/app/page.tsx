import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { PublicHomepage, type PublicHomepageProps } from "@/components/public/PublicHomepage";

export const metadata = {
  title: "Trang chủ",
  description:
    "Cổng thông tin lớp Văn bằng 2 Luật từ xa, Trường ĐH Luật TP.HCM — lịch học, thông báo, tài liệu, môn học, FAQ trong một nền tảng duy nhất.",
};

// The route reads cookies via auth() so Next.js marks it dynamic anyway —
// being explicit prevents accidental build-time prerendering attempts.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Logged-in users skip the marketing page and go straight to their dashboard.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const data = await loadHomepageData();
  return <PublicHomepage {...data} />;
}

/**
 * Loads the data shown on the public landing page. If the DB is unreachable
 * (e.g. dev environment without seed), returns empty arrays so the page
 * still renders gracefully instead of throwing a 500.
 */
async function loadHomepageData(): Promise<PublicHomepageProps> {
  const now = new Date();
  const weekEnd = addDays(now, 7);

  try {
    const [
      announcements,
      weekEvents,
      deadlines,
      courses,
      announcementsTotal,
      weekEventsTotal,
      nextDeadline,
      coursesAggregate,
    ] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          published: true,
          OR: [{ publishAt: null }, { publishAt: { lte: now } }],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
        },
        include: { author: { select: { name: true } } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.event.findMany({
        where: { date: { gte: startOfDay(now), lte: endOfDay(weekEnd) } },
        orderBy: { date: "asc" },
        take: 8,
      }),
      prisma.event.findMany({
        where: { type: "DEADLINE", date: { gte: startOfDay(now) } },
        orderBy: { date: "asc" },
        take: 6,
      }),
      prisma.course.findMany({
        orderBy: [{ order: "asc" }, { code: "asc" }],
        select: {
          id: true, slug: true, code: true, name: true,
          icon: true, credits: true, description: true,
        },
        take: 6,
      }),
      prisma.announcement.count({ where: { published: true } }),
      prisma.event.count({
        where: { date: { gte: startOfDay(now), lte: endOfDay(weekEnd) } },
      }),
      prisma.event.findFirst({
        where: { type: "DEADLINE", date: { gte: startOfDay(now) } },
        orderBy: { date: "asc" },
      }),
      prisma.course.aggregate({
        _sum: { credits: true },
        _count: { _all: true },
      }),
    ]);

    return {
      announcements,
      weekEvents,
      deadlines,
      courses,
      totals: {
        announcements: announcementsTotal,
        courses: coursesAggregate._count._all,
        credits: coursesAggregate._sum.credits ?? 0,
        weekEvents: weekEventsTotal,
        nextDeadline,
      },
      lastUpdated: new Date(),
    };
  } catch (err) {
    // DB unavailable — fall back to empty content so the marketing page
    // still works as a static surface (useful for first-boot or preview).
    console.error("[HomePage] DB load failed, rendering empty state:", err);
    return {
      announcements: [],
      weekEvents: [],
      deadlines: [],
      courses: [],
      totals: { announcements: 0, courses: 6, credits: 0, weekEvents: 0, nextDeadline: null },
      lastUpdated: new Date(),
    };
  }
}
