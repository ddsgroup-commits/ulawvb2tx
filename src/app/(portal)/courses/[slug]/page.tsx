// ============================================================
// ULAW VB2-TX LMS — Canvas-Style Course Detail Page
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, BookOpen, GraduationCap, NotebookPen, Video, FileText, Calendar, MessageSquare } from "lucide-react";

export async function generateStaticParams() {
  const courses = await prisma.course.findMany({ select: { slug: true } });
  return courses.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return { title: course ? `${course.name} — ULAW LMS` : "Môn học" };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      lecturer: { select: { name: true, email: true } },
      modules: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            include: { video: { select: { id: true, title: true, duration: true, type: true } } },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      announcements: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { author: { select: { name: true } } },
      },
      videos: {
        where: { isPublished: true },
        orderBy: { classDate: "desc" },
        take: 5,
      },
      libraryItems: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      assignments: {
        where: { isPublished: true },
        orderBy: { dueDate: "asc" },
      },
      events: {
        where: { date: { gte: new Date() }, isPublished: true },
        orderBy: { date: "asc" },
        take: 5,
      },
    },
  });

  if (!course) notFound();

  const STATUS_COLORS = {
    UPCOMING: "badge-gray",
    ACTIVE: "badge-green",
    COMPLETED: "badge-blue",
  };

  const STATUS_LABELS = {
    UPCOMING: "Sắp học",
    ACTIVE: "Đang học",
    COMPLETED: "Đã hoàn thành",
  };

  const TAB_LINKS = [
    { icon: <BookOpen className="w-4 h-4" />, label: "Tổng quan", href: `#overview` },
    { icon: <Video className="w-4 h-4" />, label: `Module (${course.modules.length})`, href: `#modules` },
    { icon: <Video className="w-4 h-4" />, label: `Video (${course.videos.length})`, href: `#videos` },
    { icon: <FileText className="w-4 h-4" />, label: `Tài liệu (${course.libraryItems.length})`, href: `#library` },
    { icon: <Calendar className="w-4 h-4" />, label: `Lịch (${course.events.length})`, href: `#schedule` },
    { icon: <MessageSquare className="w-4 h-4" />, label: "Thảo luận", href: `/portal/courses/${params.slug}/discussions` },
  ];

  return (
    <div className="space-y-6">

      {/* Course Hero */}
      <div className="page-hero">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "30px 30px"}}
        />
        <div className="relative">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl shrink-0">
              {course.icon ?? "📚"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-white/60 text-xs font-mono">{course.code}</span>
                <span className="badge bg-white/20 text-white text-xs">{course.credits} tín chỉ</span>
                <span className={`${STATUS_COLORS[course.status]} text-xs`}>{STATUS_LABELS[course.status]}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">{course.name}</h1>
              {course.lecturer && (
                <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> {course.lecturer.name}
                </p>
              )}
            </div>
          </div>

          {/* External links */}
          <div className="flex flex-wrap gap-2 mt-4">
            {course.notebooklmUrl && (
              <a href={course.notebooklmUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm border border-white/30 text-white hover:bg-white/15 gap-1.5">
                <NotebookPen className="w-3.5 h-3.5" /> NotebookLM
              </a>
            )}
            {course.driveUrl && (
              <a href={course.driveUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm border border-white/30 text-white hover:bg-white/15 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Google Drive
              </a>
            )}
            {course.elearningUrl && (
              <a href={course.elearningUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm border border-white/30 text-white hover:bg-white/15 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> ULAW eLearning
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex overflow-x-auto gap-1 -mb-2 pb-1">
        {TAB_LINKS.map(t => (
          <a key={t.label} href={t.href}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600
                       hover:bg-navy/5 hover:text-navy transition-colors whitespace-nowrap border border-transparent
                       hover:border-navy/10">
            {t.icon} {t.label}
          </a>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          {course.description && (
            <div id="overview" className="card p-6">
              <h2 className="font-bold text-navy-dark mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Giới thiệu môn học
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>

              {course.examDate && (
                <div className="mt-4 p-4 bg-ulaw/5 border border-ulaw/20 rounded-xl">
                  <div className="text-sm font-semibold text-ulaw flex items-center gap-2">
                    📝 Kỳ thi dự kiến
                  </div>
                  <div className="text-sm text-slate-700 mt-1">
                    {course.examDate.toLocaleDateString("vi-VN", {weekday: "long", day: "numeric", month: "long", year: "numeric"})}
                    {course.examFormat && ` · ${course.examFormat}`}
                  </div>
                  {course.examNotes && (
                    <p className="text-xs text-slate-500 mt-1">{course.examNotes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modules (Canvas-style) */}
          <div id="modules">
            <div className="section-head">
              <span className="font-bold text-navy-dark flex items-center gap-2">
                📋 Nội dung học tập ({course.modules.length} chủ đề)
              </span>
            </div>

            {course.modules.length === 0 ? (
              <div className="card p-8 text-center text-slate-400 text-sm">
                Chưa có nội dung học tập. Admin sẽ cập nhật sớm.
              </div>
            ) : (
              <div className="space-y-3">
                {course.modules.map((mod, idx) => (
                  <div key={mod.id} className="module-item">
                    <div className="module-header">
                      <div className="w-7 h-7 rounded-lg bg-navy/10 flex items-center justify-center text-navy font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-navy-dark text-sm">{mod.title}</div>
                        {mod.weekNumber && (
                          <div className="text-xs text-slate-400">Tuần {mod.weekNumber}</div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{mod.lessons.length} bài</span>
                    </div>
                    {mod.lessons.map(lesson => (
                      <div key={lesson.id} className="lesson-item">
                        <div className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                        <div className="flex-1 text-sm text-slate-700">{lesson.title}</div>
                        {lesson.video && (
                          <div className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`/portal/videos/${lesson.video.id}`}
                              className="text-xs text-navy hover:underline">
                              {lesson.video.duration ?? "Video"}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos */}
          {course.videos.length > 0 && (
            <div id="videos">
              <div className="section-head">
                <span className="font-bold text-navy-dark">🎬 Video bài giảng</span>
                <Link href={`/portal/videos?course=${params.slug}`} className="text-xs text-navy hover:underline">
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-2">
                {course.videos.map(v => (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                    className="card card-hover p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                      🎬
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate">{v.title}</div>
                      {v.classDate && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(v.classDate).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                    <span className={`badge text-[10px] shrink-0 ${
                      v.type === "YOUTUBE" ? "bg-red-100 text-red-700" : "badge-navy"
                    }`}>
                      {v.type === "YOUTUBE" ? "YouTube" : "Drive"}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Library */}
          {course.libraryItems.length > 0 && (
            <div id="library">
              <div className="section-head">
                <span className="font-bold text-navy-dark">📂 Tài liệu môn học</span>
              </div>
              <div className="card overflow-hidden">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Tài liệu</th>
                        <th>Loại</th>
                        <th>Tải về</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.libraryItems.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="font-medium text-sm">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                            )}
                          </td>
                          <td><span className="badge-gray text-[10px]">{item.category}</span></td>
                          <td>
                            {item.driveUrl && (
                              <a href={item.driveUrl} target="_blank" rel="noopener noreferrer"
                                className="btn-outline btn-sm">
                                Drive ↗
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Upcoming schedule */}
          <div id="schedule" className="card p-5">
            <div className="section-title mb-3">📅 Lịch sắp tới</div>
            {course.events.length === 0 ? (
              <p className="text-xs text-slate-400">Không có sự kiện sắp tới</p>
            ) : (
              <div className="space-y-3">
                {course.events.map(e => (
                  <div key={e.id} className="flex items-start gap-2.5">
                    <div className={`event-dot mt-1.5 shrink-0 event-${e.type}`}
                      style={{width: 8, height: 8, borderRadius: "50%"}} />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{e.title}</div>
                      <div className="text-xs text-slate-400">
                        {e.date.toLocaleDateString("vi-VN")}
                        {e.time && ` · ${e.time}`}
                        {e.room && ` · ${e.room}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements */}
          {course.announcements.length > 0 && (
            <div className="card p-5">
              <div className="section-title mb-3">📢 Thông báo môn học</div>
              <div className="space-y-3">
                {course.announcements.map(a => (
                  <div key={a.id}>
                    <div className="text-sm font-semibold text-slate-800 leading-tight">{a.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.author.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          {course.assignments.length > 0 && (
            <div className="card p-5">
              <div className="section-title mb-3">📝 Bài tập</div>
              <div className="space-y-3">
                {course.assignments.map(a => {
                  const daysLeft = Math.ceil((a.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-ulaw mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 leading-tight truncate">{a.title}</div>
                        <div className={`text-xs mt-0.5 font-medium ${
                          daysLeft <= 3 ? "text-ulaw" : daysLeft <= 7 ? "text-amber-600" : "text-slate-400"
                        }`}>
                          Hạn: {a.dueDate.toLocaleDateString("vi-VN")}
                          {daysLeft <= 7 && ` (${daysLeft}d)`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Assistant placeholder */}
          <div className="card p-5 bg-gradient-to-br from-purple-50 to-navy/5 border-purple-200/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤖</span>
              <span className="font-bold text-navy-dark text-sm">AI Learning Assistant</span>
              <span className="badge-purple text-[10px]">Sắp ra mắt</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Tóm tắt tài liệu, giải thích thuật ngữ pháp lý, flashcard và Q&A thông minh.
            </p>
            {course.notebooklmUrl && (
              <a href={course.notebooklmUrl} target="_blank" rel="noopener noreferrer"
                className="btn-outline btn-sm w-full">
                <NotebookPen className="w-3.5 h-3.5" /> Dùng NotebookLM ngay
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
