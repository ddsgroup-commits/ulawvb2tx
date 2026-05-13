import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonMarkComplete } from "@/components/lessons/LessonMarkComplete";
import { LessonNotes } from "@/components/lessons/LessonNotes";
import { BookmarkButton } from "@/components/lessons/BookmarkButton";
import { formatDateVi, truncate } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Film,
  ListChecks,
  PlayCircle,
  Library as LibraryIcon,
  Youtube,
  HardDrive,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export default async function LessonWatchPage({ params }: PageProps) {
  const { slug, lessonSlug } = await params;
  const session = await auth();
  if (!session?.user) return notFound();

  const userId = session.user.id;
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(session.user.role);

  // Resolve course → lesson with sibling navigation list.
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      lessons: {
        where: isAdmin ? {} : { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          order: true,
          type: true,
          status: true,
          durationMin: true,
          progress: { where: { userId }, take: 1 },
        },
      },
    },
  });
  if (!course) return notFound();

  const idx = course.lessons.findIndex((l) => l.slug === lessonSlug);
  if (idx === -1) return notFound();

  const lessonMeta = course.lessons[idx];
  const prev = idx > 0 ? course.lessons[idx - 1] : null;
  const next = idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null;

  // Heavier query: the lesson itself + course-scoped supplementary materials
  // (related videos and recent library items for the same course). These
  // power the "Related materials" sidebar that gives the page its OCW feel.
  const [lesson, relatedVideos, relatedLibrary, lessonBookmark] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonMeta.id },
      include: { progress: { where: { userId }, take: 1 } },
    }),
    prisma.video.findMany({
      where: { courseId: course.id, status: "PUBLISHED" },
      orderBy: [{ pinned: "desc" }, { classDate: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: { id: true, title: true, thumbnailUrl: true, source: true, classDate: true },
    }).catch(() => []),
    prisma.libraryItem.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, category: true, fileUrl: true, driveId: true },
    }).catch(() => []),
    prisma.bookmark.findUnique({
      where: { userId_type_itemId: { userId, type: "LESSON", itemId: lessonMeta.id } },
      select: { id: true },
    }),
  ]);
  if (!lesson) return notFound();

  const isCompleted = lesson.progress[0]?.completed ?? false;
  const completedCount = course.lessons.filter((l) => l.progress[0]?.completed).length;
  const totalCount = course.lessons.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/courses" className="hover:text-navy">Môn học</Link>
        <span>›</span>
        <Link href={`/courses/${course.slug}`} className="hover:text-navy">
          {course.name}
        </Link>
        <span>›</span>
        <span className="text-slate-700">Bài {idx + 1}</span>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Main column */}
        <div className="space-y-5 min-w-0">
          {/* Player (if any) */}
          {lesson.videoEmbed && (
            <div className="card overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe
                  src={lesson.videoEmbed}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Title + meta */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Bài {idx + 1} / {course.lessons.length}
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-navy-dark mt-1 leading-tight">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
              {lesson.durationMin && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {lesson.durationMin} phút
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                </span>
              )}
            </div>
            {lesson.description && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Content body */}
          {lesson.content && (
            <div className="card p-5 md:p-6">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Nội dung bài học
              </h2>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
                {lesson.content}
              </div>
            </div>
          )}

          {/* Attachments */}
          {lesson.attachments.length > 0 && (
            <div className="card p-5 md:p-6">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4" /> Tài liệu đính kèm
              </h2>
              <ul className="space-y-1.5">
                {lesson.attachments.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-navy hover:underline break-all"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" /> {truncate(url, 80)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Personal lesson notes */}
          <LessonNotes lessonId={lesson.id} />

          {/* Mark complete + bookmark + nav */}
          <div className="card p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <LessonMarkComplete
                lessonId={lesson.id}
                initialCompleted={isCompleted}
                nextHref={next ? `/courses/${course.slug}/lessons/${next.slug}` : null}
              />
              <BookmarkButton
                type="LESSON"
                itemId={lesson.id}
                initialBookmarked={!!lessonBookmark}
                label="Lưu bài"
              />
            </div>
            <div className="flex gap-2">
              {prev && (
                <Link href={`/courses/${course.slug}/lessons/${prev.slug}`} className="btn btn-outline btn-sm">
                  <ArrowLeft className="w-3.5 h-3.5" /> Bài trước
                </Link>
              )}
              {next && (
                <Link href={`/courses/${course.slug}/lessons/${next.slug}`} className="btn btn-outline btn-sm">
                  Bài sau <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 min-w-0">
          {/* Course progress card */}
          <div className="card p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Tiến độ môn học
            </div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium">{completedCount}/{totalCount} bài</span>
              <span className="font-semibold text-navy-dark">{percent}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-navy to-navy-light" style={{ width: `${percent}%` }} />
            </div>
          </div>

          {/* Lessons outline */}
          <aside className="card p-4 lg:p-5 lg:sticky lg:top-4">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Mục lục môn học
            </h3>
            <ol className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {course.lessons.map((l, i) => {
                const done = l.progress[0]?.completed ?? false;
                const isCurrent = l.slug === lessonSlug;
                const Icon = l.type === "VIDEO" ? Film : l.type === "READING" ? FileText : PlayCircle;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/courses/${course.slug}/lessons/${l.slug}`}
                      className={
                        isCurrent
                          ? "flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-navy text-white text-sm font-semibold"
                          : "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                      }
                    >
                      <span className={
                        done
                          ? "text-green-500"
                          : isCurrent
                            ? "text-white/80"
                            : "text-slate-400"
                      }>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 min-w-0 line-clamp-1">{l.title}</span>
                      <span className={isCurrent ? "text-white/60 text-[10px]" : "text-slate-400 text-[10px]"}>
                        {i + 1}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Related videos for this course */}
          {relatedVideos.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Film className="w-4 h-4" /> Video liên quan
              </h3>
              <ul className="space-y-2">
                {relatedVideos.map((v) => (
                  <li key={v.id}>
                    <Link href={`/videos/${v.id}`} className="flex gap-2 group">
                      <div className="w-20 aspect-video rounded bg-slate-100 shrink-0 overflow-hidden relative">
                        {v.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Film className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute bottom-0.5 right-0.5">
                          {v.source === "YOUTUBE" && <Youtube className="w-3 h-3 text-red-500 bg-white rounded" />}
                          {v.source === "DRIVE" && <HardDrive className="w-3 h-3 text-emerald-500 bg-white rounded" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-navy">
                          {v.title}
                        </div>
                        {v.classDate && (
                          <div className="text-[10.5px] text-slate-400 mt-0.5">{formatDateVi(v.classDate)}</div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related library docs */}
          {relatedLibrary.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <LibraryIcon className="w-4 h-4" /> Tài liệu môn học
              </h3>
              <ul className="space-y-1.5">
                {relatedLibrary.map((d) => {
                  const href = d.fileUrl ?? (d.driveId ? `https://drive.google.com/file/d/${d.driveId}/view` : null);
                  if (!href) return null;
                  return (
                    <li key={d.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-[12.5px] text-slate-700 hover:text-navy group"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400 group-hover:text-navy" />
                        <span className="line-clamp-2 leading-snug">{d.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-slate-300 group-hover:text-navy" />
                      </a>
                    </li>
                  );
                })}
              </ul>
              <Link href="/library" className="text-[11px] text-navy font-semibold hover:underline mt-3 inline-block">
                Mở thư viện đầy đủ →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
