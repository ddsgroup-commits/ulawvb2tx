import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateVi, relativeTime, cn } from "@/lib/utils";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Bookmark,
  StickyNote,
  PlayCircle,
  Film,
  FileText,
  Sparkles,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Học tập của tôi" };

export default async function MyLearningPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;
  const firstName = session.user.name?.split(" ").slice(-1)[0] ?? "bạn";

  // ── Aggregate everything in parallel ─────────────────────
  const [
    progressRows,
    courseAggregates,
    recentNotes,
    bookmarks,
    continueLearning,
    weeklyCompletions,
  ] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { lastViewedAt: "desc" },
      include: {
        lesson: {
          include: { course: { select: { id: true, name: true, slug: true, icon: true } } },
        },
      },
    }),
    prisma.course.findMany({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        icon: true,
        code: true,
        credits: true,
        status: true,
        description: true,
        lessons: {
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            durationMin: true,
            progress: { where: { userId }, select: { completed: true } },
          },
        },
      },
    }),
    prisma.lessonNote.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        lesson: {
          select: {
            id: true,
            slug: true,
            title: true,
            course: { select: { slug: true, name: true, icon: true } },
          },
        },
      },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.lessonProgress.findFirst({
      where: { userId, completed: false },
      orderBy: { lastViewedAt: "desc" },
      include: {
        lesson: {
          include: { course: { select: { name: true, slug: true, icon: true } } },
        },
      },
    }),
    prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        completedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    }),
  ]);

  // Resolve bookmark targets (lessons / videos / library items / courses) in
  // separate queries — easier than building dynamic joins.
  const bookmarkedLessonIds = bookmarks.filter((b) => b.type === "LESSON").map((b) => b.itemId);
  const bookmarkedVideoIds = bookmarks.filter((b) => b.type === "VIDEO").map((b) => b.itemId);
  const bookmarkedLibraryIds = bookmarks.filter((b) => b.type === "LIBRARY_ITEM").map((b) => b.itemId);

  const [bookLessons, bookVideos, bookLibrary] = await Promise.all([
    bookmarkedLessonIds.length
      ? prisma.lesson.findMany({
          where: { id: { in: bookmarkedLessonIds } },
          include: { course: { select: { slug: true, name: true, icon: true } } },
        })
      : Promise.resolve([]),
    bookmarkedVideoIds.length
      ? prisma.video.findMany({
          where: { id: { in: bookmarkedVideoIds } },
        })
      : Promise.resolve([]),
    bookmarkedLibraryIds.length
      ? prisma.libraryItem.findMany({
          where: { id: { in: bookmarkedLibraryIds } },
        })
      : Promise.resolve([]),
  ]);

  // ── Derived stats ────────────────────────────────────────
  const totalLessons = courseAggregates.reduce((s, c) => s + c.lessons.length, 0);
  const totalCompleted = progressRows.filter((p) => p.completed).length;
  const totalWatchMin = Math.floor(progressRows.reduce((s, p) => s + p.watchTimeSec, 0) / 60);
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const courseCards = courseAggregates.map((c) => {
    const total = c.lessons.length;
    const done = c.lessons.filter((l) => l.progress[0]?.completed).length;
    const totalMin = c.lessons.reduce((s, l) => s + (l.durationMin ?? 0), 0);
    return {
      ...c,
      total,
      done,
      totalMin,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      status: total > 0 && done === total ? "completed" : done > 0 ? "in-progress" : "not-started",
    };
  });

  const inProgress = courseCards.filter((c) => c.status === "in-progress");
  const completed = courseCards.filter((c) => c.status === "completed");
  const notStarted = courseCards.filter((c) => c.status === "not-started");

  return (
    <div className="space-y-7 -mx-4 lg:-mx-8 px-4 lg:px-8">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white p-6 md:p-8 lg:p-10">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-ulaw-red/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Học tập cá nhân
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold leading-tight max-w-2xl">
            Chào {firstName}, sẵn sàng học hôm nay chưa?
          </h1>
          <p className="text-white/75 text-sm md:text-base mt-2 max-w-xl">
            Quản lý bài học, ghi chú và tài liệu cá nhân — tất cả ở một nơi.
            Lấy cảm hứng từ các Open Course Portal trên thế giới (MIT OCW, Stanford Online, Coursera).
          </p>

          {continueLearning && (
            <Link
              href={`/courses/${continueLearning.lesson.course.slug}/lessons/${continueLearning.lesson.slug}`}
              className="inline-flex items-center gap-3 mt-6 bg-white text-navy-dark px-5 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <PlayCircle className="w-5 h-5 text-ulaw-red" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Tiếp tục học
                </div>
                <div className="text-sm font-bold leading-tight">
                  {continueLearning.lesson.title}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          )}
        </div>

        {/* Stats strip */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
          <StatPill icon={CheckCircle2} value={String(totalCompleted)} label="bài đã hoàn thành" />
          <StatPill icon={Clock} value={`${totalWatchMin}p`} label="thời gian học" />
          <StatPill icon={TrendingUp} value={`${overallPercent}%`} label="tổng tiến độ" />
          <StatPill icon={Calendar} value={String(weeklyCompletions)} label="bài tuần này" />
        </div>
      </section>

      {/* ── Tabs (anchor-based; CSS-only) ────────────── */}
      <nav className="flex gap-1 border-b border-slate-200 overflow-x-auto -mx-4 lg:-mx-8 px-4 lg:px-8">
        <TabLink href="#all" label="Tất cả" count={courseCards.length} active />
        <TabLink href="#in-progress" label="Đang học" count={inProgress.length} />
        <TabLink href="#completed" label="Đã hoàn thành" count={completed.length} />
        <TabLink href="#bookmarks" label="Đã lưu" count={bookmarks.length} icon={Bookmark} />
        <TabLink href="#notes" label="Ghi chú" count={recentNotes.length} icon={StickyNote} />
      </nav>

      {/* ── My Courses (Canva-style grid) ──────────── */}
      <section id="all" className="scroll-mt-20 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-navy-dark flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> Khóa học của tôi
          </h2>
          <Link
            href="/courses"
            className="text-xs text-navy font-medium hover:underline inline-flex items-center gap-1"
          >
            Khám phá thư viện môn học <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        {courseCards.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Chưa có khóa học đang theo"
            body="Mở mục Môn học để bắt đầu bài học đầu tiên."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseCards.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      {/* ── In progress ───────────────────────────── */}
      {inProgress.length > 0 && (
        <section id="in-progress" className="scroll-mt-20 space-y-4">
          <h2 className="font-serif text-xl font-bold text-navy-dark flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-ulaw-red" /> Đang học
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed ─────────────────────────────── */}
      {completed.length > 0 && (
        <section id="completed" className="scroll-mt-20 space-y-4">
          <h2 className="font-serif text-xl font-bold text-navy-dark flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" /> Đã hoàn thành
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* ── Bookmarks ─────────────────────────────── */}
      <section id="bookmarks" className="scroll-mt-20 space-y-4">
        <h2 className="font-serif text-xl font-bold text-navy-dark flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-500" /> Đã lưu
        </h2>
        {bookmarks.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Chưa có nội dung nào được lưu"
            body="Bấm biểu tượng dấu trang trên bài học, video hoặc tài liệu để lưu vào đây."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookLessons.map((l) => (
              <Link
                key={`l-${l.id}`}
                href={`/courses/${l.course.slug}/lessons/${l.slug}`}
                className="card card-hover p-4 flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center text-lg shrink-0">
                  {l.course.icon ?? "📚"}
                </div>
                <div className="min-w-0">
                  <span className="badge bg-blue-50 text-blue-700 text-[10px] mb-1">
                    <BookOpen className="w-3 h-3" /> Bài học
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-navy">
                    {l.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{l.course.name}</p>
                </div>
              </Link>
            ))}
            {bookVideos.map((v) => (
              <Link
                key={`v-${v.id}`}
                href={`/videos/${v.id}`}
                className="card card-hover p-4 flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="badge bg-red-50 text-red-700 text-[10px] mb-1">
                    <Film className="w-3 h-3" /> Video
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-navy">
                    {v.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{v.subject ?? "—"}</p>
                </div>
              </Link>
            ))}
            {bookLibrary.map((li) => (
              <Link
                key={`d-${li.id}`}
                href="/library"
                className="card card-hover p-4 flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="badge bg-emerald-50 text-emerald-700 text-[10px] mb-1">
                    <FileText className="w-3 h-3" /> Tài liệu
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-navy">
                    {li.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{li.description ?? ""}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Notes ─────────────────────────────────── */}
      <section id="notes" className="scroll-mt-20 space-y-4">
        <h2 className="font-serif text-xl font-bold text-navy-dark flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-yellow-500" /> Ghi chú gần đây
        </h2>
        {recentNotes.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="Bạn chưa viết ghi chú nào"
            body="Vào một bài học và sử dụng khung 'Ghi chú cá nhân' để lưu lại ý chính khi học."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentNotes.map((n) => (
              <Link
                key={n.id}
                href={`/courses/${n.lesson.course.slug}/lessons/${n.lesson.slug}#notes`}
                className="card card-hover p-4 flex flex-col gap-2 group bg-gradient-to-br from-yellow-50/40 to-white border-yellow-200/60"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 inline-flex items-center gap-1">
                    {n.lesson.course.icon} {n.lesson.course.name}
                  </span>
                  <span>{relativeTime(n.updatedAt)}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-navy">
                  {n.lesson.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-line">
                  {n.content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── OCW-style hint ───────────────────────── */}
      <section className="card p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-navy shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-dark">
              Mỗi môn học = một Open Course đầy đủ
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Mỗi môn trong portal được tổ chức theo phong cách
              <strong className="text-navy"> Open Course Portal</strong>: đề cương, bài giảng có
              video, ghi chú giảng dạy, đề thi mẫu và tài liệu đọc bổ trợ. Truy cập một môn để
              xem cấu trúc đầy đủ.
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-1 text-sm text-navy font-medium hover:underline mt-2"
            >
              Khám phá thư viện <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function StatPill({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold leading-none">{value}</div>
        <div className="text-[11px] text-white/65 leading-tight mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function TabLink({
  href,
  label,
  count,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  count: number;
  icon?: typeof Bookmark;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
        active
          ? "border-navy text-navy"
          : "border-transparent text-slate-500 hover:text-navy hover:border-slate-300",
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
        {count}
      </span>
    </a>
  );
}

function CourseCard({
  c,
}: {
  c: {
    slug: string;
    name: string;
    icon: string | null;
    code: string;
    credits: number;
    description: string | null;
    total: number;
    done: number;
    totalMin: number;
    percent: number;
    status: string;
  };
}) {
  const statusLabel =
    c.status === "completed"
      ? "Đã hoàn thành"
      : c.status === "in-progress"
        ? "Đang học"
        : "Chưa bắt đầu";
  const statusClass =
    c.status === "completed"
      ? "bg-green-100 text-green-700"
      : c.status === "in-progress"
        ? "bg-ulaw-red/10 text-ulaw-red"
        : "bg-slate-100 text-slate-600";

  return (
    <Link
      href={`/courses/${c.slug}`}
      className="card card-hover overflow-hidden block group"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-navy-light to-navy relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-90">
          {c.icon ?? "📚"}
        </div>
        <div className="absolute top-3 left-3">
          <span className={cn("badge text-[10px] backdrop-blur-sm bg-white/90", statusClass)}>
            {statusLabel}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
          <div
            className={cn(
              "h-full",
              c.status === "completed"
                ? "bg-green-400"
                : "bg-gradient-to-r from-amber-300 to-ulaw-red",
            )}
            style={{ width: `${c.percent}%` }}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {c.code} · {c.credits} tín chỉ
        </div>
        <h3 className="font-bold text-navy-dark mt-0.5 leading-snug line-clamp-2 group-hover:text-navy-light">
          {c.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {c.done}/{c.total} bài
          </span>
          {c.totalMin > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{c.totalMin} phút
            </span>
          )}
          <span className="font-bold text-navy">{c.percent}%</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-10 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-700 font-semibold">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{body}</p>
    </div>
  );
}
