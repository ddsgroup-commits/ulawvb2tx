import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateVi } from "@/lib/utils";
import { ArrowLeft, Calendar, GraduationCap, BookOpen, FileText, Eye, Pin } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoWatchPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return notFound();

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true, slug: true } },
      uploader: { select: { name: true } },
    },
  });
  if (!video) return notFound();

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(session.user.role);
  if (!isAdmin && video.contentStatus !== "PUBLISHED") return notFound();

  // Increment view count (don't await — fire-and-forget so the page
  // renders fast). Skip for admins so they don't inflate stats.
  if (!isAdmin) {
    prisma.video
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
  }

  const related = await prisma.video.findMany({
    where: {
      id: { not: video.id },
      contentStatus: "PUBLISHED",
      OR: [
        ...(video.courseId ? [{ courseId: video.courseId }] : []),
        ...(video.subject ? [{ subject: { equals: video.subject, mode: "insensitive" as const } }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      classDate: true,
      subject: true,
      course: { select: { name: true } },
    },
    orderBy: [{ pinned: "desc" }, { classDate: "desc" }],
    take: 6,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/videos"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại Video bài giảng
      </Link>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-5">
          {/* Player */}
          <div className="card overflow-hidden">
            <div className="aspect-video bg-black">
              {video.embedUrl ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                  Không thể nhúng video này — mở link bên dưới để xem.
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {video.pinned && (
                <span className="badge bg-navy/10 text-navy text-xs">
                  <Pin className="w-3 h-3" /> Ghim
                </span>
              )}
              {video.status !== "PUBLISHED" && (
                <span className="badge bg-amber-100 text-amber-800 text-xs">
                  {video.status === "DRAFT" ? "Bản nháp" : "Đã lưu trữ"}
                </span>
              )}
              {video.tags.map((t) => (
                <Link
                  key={t}
                  href={`/videos?tag=${encodeURIComponent(t)}`}
                  className="badge bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
                >
                  #{t}
                </Link>
              ))}
            </div>
            <h1 className="text-2xl font-extrabold text-navy-dark font-serif">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
              {video.course ? (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <Link href={`/courses/${video.course.slug}`} className="hover:text-navy">
                    {video.course.name}
                  </Link>
                </span>
              ) : video.subject ? (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> {video.subject}
                </span>
              ) : null}
              {video.lecturer && (
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> {video.lecturer}
                </span>
              )}
              {video.classDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatDateVi(video.classDate)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {video.viewCount} lượt xem
              </span>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">
                Mô tả
              </h2>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {video.description}
              </p>
            </div>
          )}

          {/* Related documents */}
          {video.relatedDocs.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider">
                Tài liệu liên quan
              </h2>
              <ul className="space-y-1.5">
                {video.relatedDocs.map((d, i) => (
                  <li key={i}>
                    <a
                      href={d}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-navy hover:underline break-all"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" /> {d}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-slate-400">
            Đăng tải bởi {video.uploader.name ?? "Ban cán sự"} · {formatDateVi(video.createdAt)} ·{" "}
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="underline">
              Mở video gốc
            </a>
          </div>
        </div>

        {/* Sidebar — related videos */}
        <aside className="space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
            Video liên quan
          </h3>
          {related.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có video liên quan.</p>
          ) : (
            related.map((r) => (
              <Link
                key={r.id}
                href={`/videos/${r.id}`}
                className="flex gap-3 group rounded-xl p-2 hover:bg-slate-50 transition-colors"
              >
                <div className="w-28 aspect-video bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  {r.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-navy">
                    {r.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {r.course?.name ?? r.subject ?? ""}
                    {r.classDate ? ` · ${formatDateVi(r.classDate)}` : ""}
                  </p>
                </div>
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
