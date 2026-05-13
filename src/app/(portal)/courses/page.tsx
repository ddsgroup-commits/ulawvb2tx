import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ExternalLink, GraduationCap, NotebookPen, PlayCircle, BookOpenCheck } from "lucide-react";
import type { CourseStatus } from "@prisma/client";

interface CourseCard {
  id: string;
  slug: string;
  code: string;
  name: string;
  credits: number;
  icon: string | null;
  description: string | null;
  status: CourseStatus;
  notebooklmUrl: string | null;
  driveUrl: string | null;
  lecturer: { name: string | null } | null;
  totalLessons: number;
  completedLessons: number;
}

export const metadata: Metadata = { title: "Môn học" };

const STATUS_LABELS: Record<CourseStatus, string> = {
  UPCOMING: "Sắp học",
  ACTIVE: "Đang học",
  COMPLETED: "Đã hoàn thành",
};

const STATUS_COLORS: Record<CourseStatus, string> = {
  UPCOMING: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default async function CoursesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const courses = await prisma.course.findMany({
    include: {
      lecturer: { select: { name: true } },
      lessons: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          progress: { where: { userId }, select: { completed: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const cards: CourseCard[] = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    name: c.name,
    credits: c.credits,
    icon: c.icon,
    description: c.description,
    status: c.status,
    notebooklmUrl: c.notebooklmUrl,
    driveUrl: c.driveUrl,
    lecturer: c.lecturer,
    totalLessons: c.lessons.length,
    completedLessons: c.lessons.filter((l) => l.progress[0]?.completed).length,
  }));

  const active = cards.filter((c) => c.status === "ACTIVE");
  const upcoming = cards.filter((c) => c.status === "UPCOMING");
  const completed = cards.filter((c) => c.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Môn học</h1>
        <p className="text-slate-500 text-sm mt-1">
          {active.length} môn đang học · {upcoming.length} môn sắp tới · {completed.length} môn đã hoàn thành
        </p>
      </div>

      {active.length > 0 && (
        <CourseSection title="Đang học" courses={active} />
      )}
      {upcoming.length > 0 && (
        <CourseSection title="Sắp tới" courses={upcoming} />
      )}
      {completed.length > 0 && (
        <CourseSection title="Đã hoàn thành" courses={completed} />
      )}
    </div>
  );
}

function CourseSection({ title, courses }: { title: string; courses: CourseCard[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => {
          const percent = c.totalLessons > 0 ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0;
          return (
            <div key={c.id} className="card card-hover p-5 flex flex-col gap-3 group">
              <Link href={`/courses/${c.slug}`} className="block space-y-3 -m-1 p-1 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-navy/8 flex items-center justify-center text-2xl">
                    {c.icon ?? "📚"}
                  </div>
                  <span className={cn("badge text-xs", STATUS_COLORS[c.status])}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {c.code} · {c.credits} tín chỉ
                  </div>
                  <h3 className="font-bold text-navy-dark mt-0.5 leading-tight group-hover:text-navy-light">
                    {c.name}
                  </h3>
                  {c.lecturer && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      {c.lecturer.name}
                    </div>
                  )}
                  {c.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}
                </div>

                {c.totalLessons > 0 ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <BookOpenCheck className="w-3.5 h-3.5" />
                        {c.completedLessons}/{c.totalLessons} bài
                      </span>
                      <span className="font-semibold text-slate-700">{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-navy to-navy-light"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">Chưa có bài học</div>
                )}
              </Link>

              <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                <Link href={`/courses/${c.slug}`} className="btn btn-primary btn-sm flex-1 justify-center">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {c.totalLessons === 0
                    ? "Mở môn học"
                    : c.completedLessons === 0
                      ? "Bắt đầu"
                      : c.completedLessons < c.totalLessons
                        ? "Tiếp tục"
                        : "Xem lại"}
                </Link>
                {c.notebooklmUrl && (
                  <a
                    href={c.notebooklmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    title="Mở NotebookLM"
                  >
                    <NotebookPen className="w-3.5 h-3.5" />
                  </a>
                )}
                {c.driveUrl && (
                  <a
                    href={c.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    title="Mở Drive"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
