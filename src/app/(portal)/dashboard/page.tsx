// ============================================================
// ULAW VB2-TX LMS — Canvas-Style Student Dashboard
// ============================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateVi, getEventTypeLabel, getEventTypeColor } from "@/lib/utils";

export const metadata = { title: "Dashboard — ULAW VB2-TX LMS" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const userName = session.user.name ?? "Sinh viên";
  const firstName = userName.split(" ").pop() ?? userName;
  const userRole = (session.user as { role?: string }).role ?? "STUDENT";
  const userEmail = session.user.email ?? "";
  const userMSSV = userEmail.split("@")[0];

  // Parallel data fetching
  const [announcements, upcomingEvents, courses, recentVideos, config, stats] = await Promise.all([
    prisma.announcement.findMany({
      where: { published: true, OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
      include: { author: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.event.findMany({
      where: { date: { gte: new Date() }, isPublished: true },
      include: { course: { select: { name: true, slug: true } } },
      orderBy: { date: "asc" },
      take: 6,
    }),
    prisma.course.findMany({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      include: { lecturer: { select: { name: true } } },
      orderBy: { order: "asc" },
      take: 6,
    }),
    prisma.video.findMany({
      where: { isPublished: true },
      include: { course: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.siteConfig.findMany(),
    Promise.resolve({
      activeCourses: await prisma.course.count({ where: { status: "ACTIVE" } }),
      totalAnnouncements: await prisma.announcement.count({ where: { published: true } }),
      upcomingExams: await prisma.event.count({ where: { type: "EXAM", date: { gte: new Date() } } }),
      upcomingDeadlines: await prisma.event.count({ where: { type: "DEADLINE", date: { gte: new Date() } } }),
    }),
  ]);

  const configMap = Object.fromEntries(config.map(c => [c.key, c.value]));
  const semester = configMap["semester"] ?? "Học kỳ I – 2026";
  const googleCalUrl = configMap["googleCalendar"];
  const attendanceUrl = configMap["formUpdate"];

  const TAG_LABELS: Record<string, string> = {
    LICH_HOC: "📅 Lịch học", DEADLINE: "⏰ Deadline", THAY_DOI: "🔄 Thay đổi",
    THI_CU: "📝 Thi cử", CHUNG_CHI: "🎓 Chứng chỉ", KHAC: "📌 Khác",
  };

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
    CREATOR: "Creator", LECTURER: "Giảng viên", STUDENT: "Sinh viên",
    PENDING_USER: "Chờ duyệt",
  };

  const today = new Date();
  const nextDeadline = upcomingEvents.find(e => e.type === "DEADLINE");
  const nextDeadlineDays = nextDeadline
    ? Math.ceil((nextDeadline.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner ────────────────────────────────── */}
      <div className="page-hero">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "30px 30px"}}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">{semester}</p>
            <h1 className="text-2xl font-extrabold text-white mb-1">
              Chào mừng, {firstName}! 👋
            </h1>
            <p className="text-white/70 text-sm">
              {userMSSV && <span className="font-mono mr-3">{userMSSV}</span>}
              <span className="role-badge role-{userRole}">{ROLE_LABELS[userRole] ?? userRole}</span>
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-white/50 text-xs mb-1">Hôm nay</div>
            <div className="text-white font-bold">{today.toLocaleDateString("vi-VN", {weekday: "long", day: "numeric", month: "long"})}</div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────── */}
      <div className="dash-grid">
        <div className="stat-card">
          <div className="stat-card-icon bg-navy/10">📚</div>
          <div className="stat-card-value">{stats.activeCourses}</div>
          <div className="stat-card-label">Môn đang học</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-ulaw/10">⏰</div>
          <div className="stat-card-value text-ulaw">{stats.upcomingDeadlines}</div>
          <div className="stat-card-label">Deadline sắp tới</div>
          {nextDeadlineDays !== null && (
            <div className="text-xs text-ulaw font-medium mt-1">Gần nhất: {nextDeadlineDays} ngày</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-purple-100">📝</div>
          <div className="stat-card-value text-purple-700">{stats.upcomingExams}</div>
          <div className="stat-card-label">Kỳ thi sắp tới</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-emerald-100">📢</div>
          <div className="stat-card-value text-emerald-700">{stats.totalAnnouncements}</div>
          <div className="stat-card-label">Thông báo</div>
        </div>
      </div>

      {/* ── Main Content Grid ──────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: Announcements + Courses */}
        <div className="lg:col-span-2 space-y-6">

          {/* Announcements */}
          <div>
            <div className="section-head">
              <span className="section-title">📢 Thông báo mới nhất</span>
              <Link href="/portal/announcements" className="text-xs text-navy font-medium hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="space-y-2">
              {announcements.length === 0 ? (
                <div className="empty-state py-8"><p className="empty-state-text">Chưa có thông báo</p></div>
              ) : (
                announcements.map(a => (
                  <div key={a.id}
                    className={`card p-4 ${a.urgent ? "border-l-4 border-l-ulaw" : a.pinned ? "border-l-4 border-l-navy" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`tag-${a.tag} text-[10px]`}>
                            {TAG_LABELS[a.tag] ?? a.tag}
                          </span>
                          {a.urgent && <span className="badge-red text-[10px]">⚡ Khẩn</span>}
                          {a.pinned && <span className="badge-navy text-[10px]">📌 Ghim</span>}
                        </div>
                        <div className="font-semibold text-slate-800 text-sm leading-tight">{a.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {a.author.name} · {formatDateVi(a.createdAt.toISOString())}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Courses */}
          <div>
            <div className="section-head">
              <span className="section-title">📚 Môn học của tôi</span>
              <Link href="/portal/courses" className="text-xs text-navy font-medium hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {courses.map(c => (
                <Link key={c.id} href={`/portal/courses/${c.slug}`}
                  className="card card-hover p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center text-xl shrink-0">
                    {c.icon ?? "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-400 font-semibold">{c.code} · {c.credits} tín chỉ</div>
                    <div className="font-bold text-navy-dark text-sm leading-tight truncate">{c.name}</div>
                    {c.lecturer && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">👨‍🏫 {c.lecturer.name}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Videos */}
          {recentVideos.length > 0 && (
            <div>
              <div className="section-head">
                <span className="section-title">🎬 Video mới nhất</span>
                <Link href="/portal/videos" className="text-xs text-navy font-medium hover:underline">
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-2">
                {recentVideos.map(v => (
                  <Link key={v.id} href={`/portal/videos/${v.id}`}
                    className="card card-hover p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                      🎬
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate">{v.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {v.course?.name ?? "Chung"} · {formatDateVi(v.createdAt.toISOString())}
                      </div>
                    </div>
                    <span className="badge-navy text-[10px] shrink-0">
                      {v.type === "YOUTUBE" ? "YouTube" : "Drive"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calendar + Quick Links */}
        <div className="space-y-6">

          {/* Upcoming events */}
          <div className="card p-5">
            <div className="section-head mb-3">
              <span className="section-title">📅 Lịch sắp tới</span>
              <Link href="/portal/calendar" className="text-xs text-navy font-medium hover:underline">
                Xem lịch →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="empty-state py-6">
                <p className="empty-state-text">Không có sự kiện sắp tới</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(e => {
                  const daysLeft = Math.ceil((e.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={e.id} className="flex items-start gap-3">
                      <div className={`event-dot mt-1.5 shrink-0 event-${e.type}`} style={{width: 8, height: 8, borderRadius: "50%"}} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 leading-tight">{e.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {e.date.toLocaleDateString("vi-VN", {day: "2-digit", month: "2-digit"})}
                          {e.time && ` · ${e.time}`}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 ${
                        daysLeft <= 2 ? "text-ulaw" : daysLeft <= 7 ? "text-amber-600" : "text-slate-400"
                      }`}>
                        {daysLeft === 0 ? "Hôm nay" : daysLeft === 1 ? "Ngày mai" : `${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {googleCalUrl && (
              <a href={googleCalUrl} target="_blank" rel="noopener"
                className="btn-outline btn-sm w-full mt-4">
                📅 Mở Google Calendar
              </a>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-5">
            <div className="section-title mb-3">⚡ Truy cập nhanh</div>
            <div className="space-y-1">
              {[
                { icon: "📚", label: "Thư viện tài liệu", href: "/portal/library" },
                { icon: "🎬", label: "Video bài giảng", href: "/portal/videos" },
                { icon: "👥", label: "Danh bạ lớp", href: "/portal/classmates" },
                { icon: "❓", label: "FAQ", href: "/portal/faq" },
                ...(attendanceUrl ? [{ icon: "✅", label: "Điểm danh", href: attendanceUrl, external: true }] : []),
                { icon: "🌐", label: "ULAW eLearning", href: "http://elearning.hcmulaw.edu.vn", external: true },
              ].map(l => (
                <a key={l.label}
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600
                             hover:bg-navy/5 hover:text-navy transition-colors">
                  <span className="text-base">{l.icon}</span>
                  <span className="flex-1">{l.label}</span>
                  {l.external && <span className="text-slate-300 text-xs">↗</span>}
                </a>
              ))}
            </div>
          </div>

          {/* Profile card */}
          <div className="card p-5 bg-navy/5 border-navy/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="avatar-md bg-navy text-white">
                {firstName[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-navy-dark text-sm">{userName}</div>
                <div className="text-xs text-slate-500">{userEmail}</div>
              </div>
            </div>
            <Link href="/portal/profile" className="btn-outline btn-sm w-full">
              Hồ sơ & Cài đặt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
