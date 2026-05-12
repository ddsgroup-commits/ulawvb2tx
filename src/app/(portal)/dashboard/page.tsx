import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { formatDateVi, daysUntil, EVENT_TYPE_COLORS, TAG_LABELS, TAG_COLORS } from "@/lib/utils";
import {
  Megaphone,
  CalendarDays,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Pin,
  Film,
  PlayCircle,
  GraduationCap,
  CheckCircle2,
  Library as LibraryIcon,
  Brain,
  Bookmark,
  Sparkles,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, startOfDay, endOfDay } from "date-fns";

export const metadata: Metadata = { title: "Bảng điều khiển" };

/**
 * Vietnamese first-name extraction. "Trần Nguyễn Anh Linh" → "Linh".
 */
function firstName(full: string | null | undefined): string {
  if (!full) return "bạn";
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] || full;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const now = new Date();
  const weekEnd = addDays(now, 7);

  const [
    recentAnnouncements,
    weekEvents,
    nextDeadline,
    activeCourses,
    recentVideos,
    continueLearning,
    courseProgressRaw,
    libraryCount,
    videoCount,
    bookmarkCount,
  ] = await Promise.all([
    prisma.announcement.findMany({
      where: { published: true },
      include: { author: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.event.findMany({
      where: { date: { gte: startOfDay(now), lte: endOfDay(weekEnd) } },
      orderBy: { date: "asc" },
      take: 8,
    }),
    prisma.event.findFirst({
      where: { type: "DEADLINE", date: { gte: startOfDay(now) } },
      orderBy: { date: "asc" },
    }),
    prisma.course.count({ where: { status: "ACTIVE" } }),
    prisma.video.findMany({
      where: { contentStatus: "PUBLISHED" },
      include: { course: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { classDate: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    userId
      ? prisma.lessonProgress.findFirst({
          where: { userId, completed: false },
          orderBy: { lastViewedAt: "desc" },
          include: {
            lesson: {
              include: { course: { select: { name: true, slug: true, icon: true } } },
            },
          },
        })
      : Promise.resolve(null),
    prisma.course.findMany({
      where: { status: "ACTIVE" },
      orderBy: { order: "asc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        name: true,
        icon: true,
        lessons: {
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            progress: userId ? { where: { userId }, select: { completed: true } } : false,
          },
        },
      },
    }),
    prisma.libraryItem.count().catch(() => 0),
    prisma.video.count({ where: { contentStatus: "PUBLISHED" } }).catch(() => 0),
    userId ? prisma.bookmark.count({ where: { userId } }).catch(() => 0) : Promise.resolve(0),
  ]);

  const courseProgress = (courseProgressRaw as Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    lessons: Array<{ id: string; progress?: Array<{ completed: boolean }> }>;
  }>).map((c) => {
    const total = c.lessons.length;
    const done = c.lessons.filter((l) => l.progress?.[0]?.completed).length;
    return { ...c, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  });

  const newCount = recentAnnouncements.filter(a =>
    (now.getTime() - new Date(a.createdAt).getTime()) < 7 * 86400000
  ).length;
  const urgentNotice = recentAnnouncements.find(a => a.urgent);

  const totalLessons = courseProgress.reduce((s, c) => s + c.total, 0);
  const totalCompleted = courseProgress.reduce((s, c) => s + c.done, 0);
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════
          HERO – Canva-style welcome panel
          ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white isolate">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-ulaw-red/30 blur-3xl pointer-events-none" />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-gold mb-1.5 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {greeting()}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold leading-tight">
                {firstName(session?.user?.name)}, bạn muốn học gì hôm nay?
              </h1>
              <p className="text-white/75 text-sm mt-2">
                Lớp VB2 Luật · ULAW HCM · {formatDateVi(now, "EEEE, dd 'tháng' MM, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-white/60 uppercase tracking-wide">Tiến độ tổng</div>
                <div className="font-serif text-2xl font-extrabold">{overallPercent}%</div>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-gold/30 flex items-center justify-center bg-white/10 shrink-0">
                <GraduationCap className="w-6 h-6 text-gold" />
              </div>
            </div>
          </div>

          {/* Quick search → AI Hub */}
          <Link
            href="/ai-hub"
            className="group flex items-center gap-3 w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 transition-colors mb-5"
          >
            <Search className="w-4 h-4 text-white/70 shrink-0" />
            <span className="text-sm text-white/85 flex-1">
              Hỏi AI Study Hub: bản chất Nhà nước, hợp đồng dân sự, hành vi vi phạm…
            </span>
            <span className="badge bg-gold text-navy-dark text-[10px] shrink-0">AI</span>
            <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white shrink-0 transition-colors" />
          </Link>

          {/* Quick-action tiles — Canva-style category tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <QuickTile href="/courses"       icon={<BookOpen className="w-5 h-5" />}    label="Môn học"    color="from-blue-500/30 to-blue-700/10" />
            <QuickTile href="/videos"        icon={<Film className="w-5 h-5" />}        label="Video"       color="from-rose-500/30 to-rose-700/10" />
            <QuickTile href="/library"       icon={<LibraryIcon className="w-5 h-5" />} label="Thư viện"    color="from-emerald-500/30 to-emerald-700/10" />
            <QuickTile href="/schedule"      icon={<CalendarDays className="w-5 h-5" />} label="Lịch học"   color="from-amber-500/30 to-amber-700/10" />
            <QuickTile href="/my-learning"   icon={<Bookmark className="w-5 h-5" />}    label="Đã lưu"     color="from-purple-500/30 to-purple-700/10" badge={bookmarkCount} />
            <QuickTile href="/ai-hub"        icon={<Brain className="w-5 h-5" />}       label="AI Hub"      color="from-fuchsia-500/30 to-fuchsia-700/10" highlight />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CONTINUE LEARNING — visually prominent
          ═══════════════════════════════════════════════════ */}
      {continueLearning && (
        <Link
          href={`/courses/${continueLearning.lesson.course.slug}/lessons/${continueLearning.lesson.slug}`}
          className="card card-hover overflow-hidden block group border-l-4 border-l-ulaw-red"
        >
          <div className="flex items-center gap-4 p-4 md:p-5">
            <div className="w-12 h-12 rounded-2xl bg-navy/8 flex items-center justify-center text-2xl shrink-0">
              {continueLearning.lesson.course.icon ?? "📚"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-ulaw-red uppercase tracking-wide">
                Đang học · {continueLearning.lesson.course.name}
              </div>
              <h3 className="font-bold text-navy-dark mt-0.5 leading-tight truncate group-hover:text-navy">
                {continueLearning.lesson.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tiếp tục từ {formatDateVi(continueLearning.lastViewedAt)}
                {continueLearning.lesson.durationMin ? ` · ${continueLearning.lesson.durationMin} phút` : ""}
              </p>
            </div>
            <PlayCircle className="w-7 h-7 text-navy shrink-0 group-hover:text-navy-light" />
          </div>
        </Link>
      )}

      {/* Urgent notice */}
      {urgentNotice && (
        <div className="notice-danger flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">{urgentNotice.title}</div>
            <div className="text-sm mt-0.5 line-clamp-2 opacity-80">{urgentNotice.content}</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STATS BAND
          ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Megaphone className="w-5 h-5" />}
          label="Thông báo mới"
          value={newCount.toString()}
          sub="trong 7 ngày qua"
          color="blue"
        />
        <StatCard
          icon={<CalendarDays className="w-5 h-5" />}
          label="Sự kiện tuần này"
          value={weekEvents.length.toString()}
          sub="buổi học / deadline"
          color="navy"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Deadline gần nhất"
          value={nextDeadline ? `${daysUntil(nextDeadline.date)} ngày` : "—"}
          sub={nextDeadline?.title ?? "Không có deadline"}
          color="amber"
          highlight={!!nextDeadline && daysUntil(nextDeadline.date) <= 3}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Môn học đang học"
          value={activeCourses.toString()}
          sub={`${videoCount} video · ${libraryCount} tài liệu`}
          color="green"
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          COURSE PROGRESS
          ═══════════════════════════════════════════════════ */}
      {courseProgress.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-dark flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Tiến độ học tập
            </h2>
            <Link href="/courses" className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
              Tất cả môn học <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {courseProgress.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                className="block rounded-xl p-3 border border-slate-100 hover:border-navy/30 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="text-xl shrink-0">{c.icon ?? "📚"}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{c.name}</h3>
                    <div className="flex items-center justify-between text-[11px] mt-1.5 mb-1">
                      <span className="text-slate-500 inline-flex items-center gap-1">
                        {c.done === c.total && c.total > 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        {c.done}/{c.total} bài
                      </span>
                      <span className="font-semibold text-slate-700">{c.percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          c.done === c.total && c.total > 0
                            ? "bg-green-500"
                            : "bg-gradient-to-r from-navy to-navy-light",
                        )}
                        style={{ width: `${c.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT GRID — announcements + videos + events
          ═══════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent announcements */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-dark flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Thông báo
            </h2>
            <Link href="/announcements" className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-2.5">
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-navy mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={cn("badge text-[10px]", TAG_COLORS[a.tag])}>
                        {TAG_LABELS[a.tag]}
                      </span>
                      {a.urgent && (
                        <span className="badge text-[10px] bg-red-100 text-red-600">Khẩn</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.author.name} · {formatDateVi(a.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentAnnouncements.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Chưa có thông báo nào.
              </div>
            )}
          </div>
        </div>

        {/* Recent videos */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-dark flex items-center gap-2">
              <Film className="w-4 h-4" /> Video bài giảng mới
            </h2>
            <Link href="/videos" className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentVideos.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              Chưa có video nào. Ban cán sự sẽ đăng tải sau buổi học đầu tiên.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              {recentVideos.map((v) => (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="group rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="aspect-video bg-slate-200 relative">
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-navy">
                      {v.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {v.course?.name ?? v.subject ?? "—"}
                      {v.classDate ? ` · ${formatDateVi(v.classDate)}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Week events */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-dark flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> 7 ngày tới
            </h2>
            <Link href="/schedule" className="text-xs text-navy font-medium hover:underline flex items-center gap-1">
              Xem lịch <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {weekEvents.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Không có sự kiện nào trong tuần này 🎉
              </div>
            ) : (
              weekEvents.map((e) => (
                <div key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", EVENT_TYPE_COLORS[e.type])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateVi(e.date)} {e.time ? `· ${e.time}` : ""}
                      {e.room ? ` · ${e.room}` : ""}
                    </p>
                  </div>
                  {daysUntil(e.date) === 0 && (
                    <span className="badge bg-navy text-white text-[10px]">Hôm nay</span>
                  )}
                  {daysUntil(e.date) === 1 && (
                    <span className="badge bg-gold text-white text-[10px]">Ngày mai</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────── */

function QuickTile({
  href, icon, label, color, highlight, badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  highlight?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col items-start gap-2 p-3 rounded-xl bg-gradient-to-br",
        color,
        "border border-white/15 hover:border-white/35 transition-all hover:-translate-y-0.5",
      )}
    >
      <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white">
        {icon}
      </div>
      <div className="text-sm font-semibold text-white">{label}</div>
      {highlight && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-gold text-navy-dark px-1.5 py-0.5 rounded-full">
          AI
        </span>
      )}
      {!highlight && badge != null && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 text-[10px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

function StatCard({
  icon, label, value, sub, color, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    navy: "bg-navy/10 text-navy",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className={cn("card p-4", highlight && "border-amber-300 bg-amber-50/30")}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colorMap[color])}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-navy-dark">{value}</div>
      <div className="text-xs font-semibold text-slate-600 mt-0.5">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</div>
    </div>
  );
}
