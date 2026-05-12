import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatDateVi, daysUntil } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  NotebookPen,
  ExternalLink,
  PlayCircle,
  CheckCircle2,
  Clock,
  Film,
  FileText,
  Library as LibraryIcon,
  ClipboardList,
  Pin,
  Youtube,
  HardDrive,
  Download,
  CalendarClock,
  Layers,
  BookMarked,
} from "lucide-react";
import type { LessonType, LibraryCategory } from "@prisma/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "Video",
  READING: "Đọc",
  QUIZ: "Quiz",
  MIXED: "Hỗn hợp",
};

const LESSON_TYPE_BADGE: Record<LessonType, string> = {
  VIDEO:   "bg-red-50 text-red-700",
  READING: "bg-blue-50 text-blue-700",
  QUIZ:    "bg-amber-50 text-amber-700",
  MIXED:   "bg-purple-50 text-purple-700",
};

const LESSON_TYPE_ICON: Record<LessonType, React.ElementType> = {
  VIDEO: Film,
  READING: FileText,
  QUIZ: BookOpen,
  MIXED: PlayCircle,
};

const LIB_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  LEGAL_DOC:    "Văn bản pháp luật",
  TEXTBOOK:     "Giáo trình",
  PAST_EXAM:    "Đề thi mẫu",
  LECTURE_NOTE: "Slide & ghi chú bài giảng",
  SYLLABUS:     "Đề cương môn học",
  READING:      "Tài liệu đọc bổ trợ",
};

const LIB_CATEGORY_ICON: Record<LibraryCategory, React.ElementType> = {
  LEGAL_DOC:    FileText,
  TEXTBOOK:     BookOpen,
  PAST_EXAM:    ClipboardList,
  LECTURE_NOTE: NotebookPen,
  SYLLABUS:     BookMarked,
  READING:      BookOpen,
};

// Order in which to display category sections within "Tài liệu" (non-exam).
const DOC_CATEGORY_ORDER: LibraryCategory[] = [
  "SYLLABUS", "LECTURE_NOTE", "TEXTBOOK", "LEGAL_DOC", "READING",
];

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) return notFound();

  const userId = session.user.id;
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(session.user.role);

  // Fetch everything for the course in parallel — this is an OCW-style
  // single-page course site, so we deliberately pull lessons, videos,
  // library docs, and assignments together.
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lecturer: { select: { name: true, email: true } },
      lessons: {
        where: isAdmin ? {} : { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        include: {
          progress: { where: { userId }, take: 1 },
        },
      },
      videos: {
        where: isAdmin ? {} : { status: "PUBLISHED" },
        orderBy: [{ pinned: "desc" }, { classDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true, title: true, thumbnailUrl: true, source: true,
          classDate: true, lecturer: true, viewCount: true, pinned: true, tags: true,
        },
      },
      libraryItems: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, description: true, category: true,
          fileUrl: true, driveId: true, downloadCount: true, createdAt: true,
        },
      },
      assignments: {
        where: isAdmin ? {} : { status: "PUBLISHED" },
        orderBy: { dueDate: "asc" },
        select: {
          id: true, title: true, description: true, dueDate: true,
          fileUrl: true, maxScore: true,
        },
      },
    },
  });
  if (!course) return notFound();

  const lessons = course.lessons;
  const completedCount = lessons.filter((l) => l.progress[0]?.completed).length;
  const totalCount = lessons.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalDuration = lessons.reduce((s, l) => s + (l.durationMin ?? 0), 0);

  // "Continue from" = first incomplete (or first if all done).
  const nextLesson = lessons.find((l) => !l.progress[0]?.completed) ?? lessons[0] ?? null;

  // Library partitioned: docs (legal + textbook) vs exam papers.
  const docs = course.libraryItems.filter((d) => d.category !== "PAST_EXAM");
  const exams = course.libraryItems.filter((d) => d.category === "PAST_EXAM");
  const docsByCategory = docs.reduce<Partial<Record<LibraryCategory, typeof docs>>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  const upcomingAssignment = course.assignments.find((a) => daysUntil(a.dueDate) >= 0);

  const statusLabel =
    course.status === "ACTIVE" ? "Đang học" :
    course.status === "UPCOMING" ? "Sắp học" :
    "Đã hoàn thành";

  return (
    <div className="space-y-6">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách môn học
      </Link>

      {/* ── Course banner ────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white p-6 md:p-8 relative">
          <div className="absolute right-6 top-6 hidden md:block">
            <span className="badge bg-white/15 text-white border border-white/20 text-xs">
              {statusLabel}
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl shrink-0">
              {course.icon ?? "📚"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                {course.code} · {course.credits} tín chỉ · Học kỳ I 2026
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-extrabold mt-1 leading-tight">
                {course.name}
              </h1>
              {course.lecturer?.name && (
                <div className="flex items-center gap-1.5 text-sm text-white/75 mt-2">
                  <GraduationCap className="w-4 h-4" /> {course.lecturer.name}
                </div>
              )}
              {course.description && (
                <p className="text-sm text-white/80 mt-3 max-w-2xl leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress + CTA bar */}
        <div className="p-5 md:p-6 bg-white flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Tiến độ của bạn
              </span>
              <span className="text-xs text-slate-500">
                {completedCount}/{totalCount} bài học · {percent}%
                {totalDuration > 0 ? ` · ~${totalDuration} phút` : ""}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-navy to-navy-light transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {nextLesson && (
              <Link
                href={`/courses/${course.slug}/lessons/${nextLesson.slug}`}
                className="btn btn-primary"
              >
                <PlayCircle className="w-4 h-4" />
                {completedCount === 0 ? "Bắt đầu học" : completedCount < totalCount ? "Tiếp tục học" : "Xem lại"}
              </Link>
            )}
            {course.notebooklmUrl && (
              <a href={course.notebooklmUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <NotebookPen className="w-4 h-4" /> NotebookLM
              </a>
            )}
            {course.driveUrl && (
              <a href={course.driveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <ExternalLink className="w-4 h-4" /> Drive
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Materials at a Glance ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlanceTile href="#lessons" icon={<Layers className="w-4 h-4" />} count={totalCount} label="Bài học" accent="navy" />
        <GlanceTile href="#videos" icon={<Film className="w-4 h-4" />} count={course.videos.length} label="Video bài giảng" accent="red" />
        <GlanceTile href="#docs" icon={<LibraryIcon className="w-4 h-4" />} count={docs.length} label="Tài liệu" accent="amber" />
        <GlanceTile href="#exams" icon={<ClipboardList className="w-4 h-4" />} count={exams.length + course.assignments.length} label="Đề thi & Bài tập" accent="purple" />
      </div>

      {/* ── Sticky section nav ───────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-slate-50 -mx-4 lg:-mx-8 px-4 lg:px-8 py-2.5 border-b border-slate-200 backdrop-blur supports-[backdrop-filter]:bg-slate-50/85">
        <ul className="flex gap-1 flex-wrap text-xs font-semibold">
          <NavPill href="#lessons" icon={<Layers className="w-3.5 h-3.5" />} label="Bài học" badge={totalCount} />
          <NavPill href="#videos" icon={<Film className="w-3.5 h-3.5" />} label="Video" badge={course.videos.length} />
          <NavPill href="#docs" icon={<LibraryIcon className="w-3.5 h-3.5" />} label="Tài liệu" badge={docs.length} />
          <NavPill href="#exams" icon={<ClipboardList className="w-3.5 h-3.5" />} label="Đề thi" badge={exams.length + course.assignments.length} />
        </ul>
      </nav>

      {/* ── LESSONS ──────────────────────────────────────────── */}
      <section id="lessons" className="scroll-mt-20">
        <SectionHeader
          icon={<Layers className="w-4 h-4" />}
          title="Bài học"
          subtitle={`${totalCount} bài · ${totalDuration > 0 ? `tổng ~${totalDuration} phút` : "thời lượng đang cập nhật"}`}
        />
        {lessons.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-10 h-10" />} title="Chưa có bài học nào" sub="Giảng viên hoặc admin sẽ thêm bài học sớm." />
        ) : (
          <ol className="space-y-2">
            {lessons.map((l, idx) => {
              const Icon = LESSON_TYPE_ICON[l.type];
              const done = l.progress[0]?.completed ?? false;
              const inProgress = !done && l.progress[0] != null;
              return (
                <li key={l.id}>
                  <Link
                    href={`/courses/${course.slug}/lessons/${l.slug}`}
                    className={cn(
                      "card card-hover flex items-center gap-4 p-4 transition-all",
                      done && "bg-green-50/40 border-green-200",
                    )}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : inProgress ? (
                        <PlayCircle className="w-5 h-5 text-navy" />
                      ) : (
                        <span className="text-slate-500">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("badge text-[10px]", LESSON_TYPE_BADGE[l.type])}>
                          <Icon className="w-3 h-3" /> {LESSON_TYPE_LABELS[l.type]}
                        </span>
                        {l.status !== "PUBLISHED" && (
                          <span className="badge bg-slate-100 text-slate-500 text-[10px]">
                            {l.status === "DRAFT" ? "Bản nháp" : "Lưu trữ"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 mt-0.5 leading-snug">
                        {l.title}
                      </h3>
                      {l.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {l.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {l.durationMin && (
                        <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> {l.durationMin} phút
                        </div>
                      )}
                      {done && (
                        <div className="text-[10px] text-green-700 font-semibold mt-0.5">
                          ✓ Đã hoàn thành
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── VIDEOS ───────────────────────────────────────────── */}
      <section id="videos" className="scroll-mt-20">
        <SectionHeader
          icon={<Film className="w-4 h-4" />}
          title="Video bài giảng"
          subtitle={`${course.videos.length} video — YouTube và Google Drive`}
          more={course.videos.length > 0 ? { href: "/videos", label: "Toàn bộ video →" } : undefined}
        />
        {course.videos.length === 0 ? (
          <EmptyState icon={<Film className="w-10 h-10" />} title="Chưa có video bài giảng" sub="Sẽ được đăng tải sau buổi học đầu tiên." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.videos.slice(0, 9).map((v) => (
              <Link key={v.id} href={`/videos/${v.id}`} className="card card-hover overflow-hidden group flex flex-col">
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Film className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow" />
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    {v.pinned && <span className="badge bg-white/95 text-navy text-[10px]"><Pin className="w-3 h-3" /></span>}
                    {v.source === "YOUTUBE" && <span className="badge bg-red-600 text-white text-[10px]"><Youtube className="w-3 h-3" /></span>}
                    {v.source === "DRIVE" && <span className="badge bg-emerald-600 text-white text-[10px]"><HardDrive className="w-3 h-3" /></span>}
                  </div>
                </div>
                <div className="p-3.5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-navy">
                    {v.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">
                    {v.lecturer ?? "—"}{v.classDate ? ` · ${formatDateVi(v.classDate)}` : ""}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-auto pt-2">{v.viewCount} lượt xem</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── DOCUMENTS ────────────────────────────────────────── */}
      <section id="docs" className="scroll-mt-20">
        <SectionHeader
          icon={<LibraryIcon className="w-4 h-4" />}
          title="Tài liệu môn học"
          subtitle={`${docs.length} tài liệu — văn bản pháp luật và giáo trình tham khảo`}
          more={docs.length > 0 ? { href: "/library", label: "Toàn bộ thư viện →" } : undefined}
        />
        {docs.length === 0 ? (
          <EmptyState icon={<LibraryIcon className="w-10 h-10" />} title="Chưa có tài liệu cho môn này" sub="Tài liệu sẽ được tổng hợp dần qua các buổi học." />
        ) : (
          <div className="space-y-4">
            {DOC_CATEGORY_ORDER.filter((cat) => (docsByCategory[cat]?.length ?? 0) > 0).map((cat) => {
              const items = docsByCategory[cat]!;
              const Icon = LIB_CATEGORY_ICON[cat];
              return (
                <div key={cat}>
                  <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm mb-2">
                    <Icon className="w-4 h-4" />
                    {LIB_CATEGORY_LABELS[cat]}
                    <span className="text-xs font-normal text-slate-400">({items.length})</span>
                  </h3>
                  <div className="card overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {items.map((d) => {
                        const href = d.fileUrl ?? (d.driveId ? `https://drive.google.com/file/d/${d.driveId}/view` : null);
                        return (
                          <div key={d.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50/60">
                            <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 text-sm leading-snug">{d.title}</div>
                              {d.description && (
                                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{d.description}</div>
                              )}
                              <div className="text-[10.5px] text-slate-400 mt-0.5">
                                Thêm vào {formatDateVi(d.createdAt)} · {d.downloadCount} lượt tải
                              </div>
                            </div>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm shrink-0"
                              >
                                {d.fileUrl ? <><Download className="w-3.5 h-3.5" /> Tải về</> : <><ExternalLink className="w-3.5 h-3.5" /> Drive</>}
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 shrink-0">Chưa có file</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── EXAMS & ASSIGNMENTS ──────────────────────────────── */}
      <section id="exams" className="scroll-mt-20">
        <SectionHeader
          icon={<ClipboardList className="w-4 h-4" />}
          title="Đề thi mẫu & Bài tập"
          subtitle={`${exams.length} đề thi mẫu · ${course.assignments.length} bài tập${upcomingAssignment ? ` · gần nhất ${formatDateVi(upcomingAssignment.dueDate)}` : ""}`}
        />

        {course.assignments.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5" /> Bài tập
            </div>
            {course.assignments.map((a) => {
              const days = daysUntil(a.dueDate);
              return (
                <div key={a.id} className="card p-4 flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold leading-tight shrink-0",
                    days < 0 ? "bg-slate-100 text-slate-500" :
                    days <= 3 ? "bg-red-100 text-red-700" :
                    days <= 7 ? "bg-amber-100 text-amber-700" : "bg-navy/10 text-navy",
                  )}>
                    <CalendarClock className="w-4 h-4" />
                    <span>{days < 0 ? "Đã qua" : days === 0 ? "Hôm nay" : `${days} ngày`}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{a.title}</div>
                    {a.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.description}</div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1">
                      Hạn nộp: <strong className="text-slate-600 font-semibold">{formatDateVi(a.dueDate, "dd/MM/yyyy")}</strong>
                      {a.maxScore ? ` · Tối đa ${a.maxScore} điểm` : ""}
                    </div>
                  </div>
                  {a.fileUrl && (
                    <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm shrink-0">
                      <Download className="w-3.5 h-3.5" /> Đề bài
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {exams.length === 0 && course.assignments.length === 0 ? (
          <EmptyState icon={<ClipboardList className="w-10 h-10" />} title="Chưa có đề thi mẫu" sub="Sẽ được cập nhật khi đến kỳ thi." />
        ) : exams.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {exams.map((d) => {
                const href = d.fileUrl ?? (d.driveId ? `https://drive.google.com/file/d/${d.driveId}/view` : null);
                return (
                  <div key={d.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50/60">
                    <ClipboardList className="w-4 h-4 shrink-0 text-purple-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{d.title}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5">
                        Thêm vào {formatDateVi(d.createdAt)} · {d.downloadCount} lượt tải
                      </div>
                    </div>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm shrink-0">
                        {d.fileUrl ? <><Download className="w-3.5 h-3.5" /> Tải về</> : <><ExternalLink className="w-3.5 h-3.5" /> Drive</>}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 shrink-0">Chưa có file</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Local sub-components
   ────────────────────────────────────────────────────────── */

function GlanceTile({
  href, icon, count, label, accent,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
  label: string;
  accent: "navy" | "red" | "amber" | "purple";
}) {
  const accentMap: Record<typeof accent, string> = {
    navy:   "bg-navy/10 text-navy",
    red:    "bg-red-100 text-red-700",
    amber:  "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <a href={href} className="card card-hover p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accentMap[accent])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-navy-dark leading-none font-serif">{count}</div>
        <div className="text-[11px] text-slate-500 mt-1">{label}</div>
      </div>
    </a>
  );
}

function NavPill({
  href, icon, label, badge,
}: { href: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <li>
      <a
        href={href}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-navy hover:text-navy transition-colors"
      >
        {icon} {label}
        {badge != null && badge > 0 && (
          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
      </a>
    </li>
  );
}

function SectionHeader({
  icon, title, subtitle, more,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  more?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
      <div>
        <h2 className="font-serif text-xl font-extrabold text-navy-dark flex items-center gap-2">
          {icon} {title}
        </h2>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
      {more && (
        <Link href={more.href} className="text-xs text-navy font-semibold hover:underline whitespace-nowrap">
          {more.label}
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-slate-300 inline-block mb-3">{icon}</div>
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-slate-400 text-sm mt-1">{sub}</p>
    </div>
  );
}
