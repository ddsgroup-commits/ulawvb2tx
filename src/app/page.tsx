// ============================================================
// ULAW VB2-TX LMS — Public Homepage
// Academic-grade landing page inspired by ULAW official site
// ============================================================

import Link from "next/link";
import prisma from "@/lib/prisma";
import { Megaphone, GraduationCap, PlayCircle, Book, Calendar, Users, HelpCircle, Lock } from "lucide-react";

// This page pulls live announcements + courses from the DB, so it
// must be rendered per-request rather than at build time. Without
// `force-dynamic`, `next build` tries to prerender and fails when
// DATABASE_URL points at an unreachable instance (e.g. CI builds).
export const dynamic = "force-dynamic";

// Fallback data if DB is empty
const DEFAULT_QUICK_LINKS = [
  { icon: <Megaphone className="w-4 h-4" />, label: "Thông báo", href: "/portal/announcements" },
  { icon: <Calendar className="w-4 h-4" />, label: "Lịch học & Deadline", href: "/portal/calendar" },
  { icon: <Book className="w-4 h-4" />, label: "6 Môn học", href: "/portal/courses" },
  { icon: <PlayCircle className="w-4 h-4" />, label: "Video bài giảng", href: "/portal/videos" },
  { icon: <Book className="w-4 h-4" />, label: "Thư viện tài liệu", href: "/portal/library" },
  { icon: <Users className="w-4 h-4" />, label: "Danh bạ lớp", href: "/portal/classmates" },
  { icon: <HelpCircle className="w-4 h-4" />, label: "FAQ", href: "/portal/faq" },
  { icon: <Lock className="w-4 h-4" />, label: "Đăng nhập Portal", href: "/login" },
];

const DEFAULT_FEATURES = [
  {
    icon: "🎓",
    title: "Canvas-style LMS",
    desc: "Dashboard học tập hiện đại, quản lý môn học, bài tập, lịch thi và tiến độ học tập theo chuẩn quốc tế.",
  },
  {
    icon: "🎬",
    title: "Thư viện Video",
    desc: "Kho lưu trữ bài giảng video với YouTube, Google Drive. Đánh dấu, ghi chú riêng, tìm kiếm theo môn.",
  },
  {
    icon: "📖",
    title: "Thư viện Pháp luật",
    desc: "Văn bản pháp luật, giáo trình, slide, đề thi mẫu — tất cả được liên kết với Google Drive.",
  },
  {
    icon: "📅",
    title: "Lịch học đồng bộ",
    desc: "Lịch học, lịch thi, deadline tự động đồng bộ về Google Calendar cá nhân.",
  },
  {
    icon: "🤖",
    title: "AI Learning Assistant",
    desc: "Tích hợp NotebookLM cho từng môn học. Nền tảng sẵn sàng cho AI pháp lý trong tương lai.",
  },
  {
    icon: "🔐",
    title: "Bảo mật & Phân quyền",
    desc: "6 cấp quyền: Super Admin, Admin, Moderator, Creator, Sinh viên, Pending. Xác thực Google OAuth.",
  },
];

const DEFAULT_STATS = [
  { value: "6", label: "Môn học" },
  { value: "18", label: "Tín chỉ HKI" },
  { value: "100+", label: "Thành viên lớp" },
  { value: "24/7", label: "Học mọi lúc mọi nơi" },
];

async function getSiteData() {
  const [config, announcements, courses] = await Promise.all([
    prisma.siteConfig.findFirst({ where: { id: "default" } }),
    prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.course.findMany({
      where: { status: "ACTIVE" },
      orderBy: { order: "asc" },
      take: 6
    })
  ]);

  return { config, announcements, courses };
}

export default async function PublicHomePage() {
  const { config, announcements, courses } = await getSiteData();

  // Map dynamic data or fallbacks
  const stats = (config?.stats as any[]) || DEFAULT_STATS;
  const features = (config?.features as any[]) || DEFAULT_FEATURES;
  const quickLinks = (config?.quickLinks as any[]) || DEFAULT_QUICK_LINKS;
  const siteName = config?.siteName || "ULAW VB2-TX";
  const heroTitle = config?.heroTitle || "Văn bằng 2 Luật từ xa.";
  const heroSubtitle = config?.heroSubtitle || "Học thuật chuẩn mực.";

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top utility bar ────────────────────────────────── */}
      <div className="bg-navy-dark text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          <span className="text-navy-200">
            🏛 Trường Đại học Luật TP. Hồ Chí Minh · Lớp Văn bằng 2 từ xa – Khóa 1
          </span>
          <div className="flex items-center gap-4 text-navy-200">
            <a href="https://www.hcmulaw.edu.vn" target="_blank" rel="noopener"
               className="hover:text-white transition-colors">hcmulaw.edu.vn</a>
            <a href="http://elearning.hcmulaw.edu.vn" target="_blank" rel="noopener"
               className="hover:text-white transition-colors">eLearning</a>
            <a href="https://www.facebook.com/hcmulaw" target="_blank" rel="noopener"
               className="hover:text-white transition-colors">Facebook</a>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="public-nav shadow-nav sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-sm">
              UL
            </div>
            <div>
              <div className="font-bold text-navy text-sm leading-tight">{siteName}</div>
              <div className="text-[10px] text-slate-500 leading-tight">LMS · Khóa 1 · 2026</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-navy transition-colors">Tính năng</Link>
            <Link href="#announcements" className="hover:text-navy transition-colors">Thông báo</Link>
            <Link href="#courses" className="hover:text-navy transition-colors">Môn học</Link>
            <a href="https://www.hcmulaw.edu.vn" target="_blank" rel="noopener"
               className="hover:text-navy transition-colors">ULAW chính thức</a>
          </div>

          <Link href="/login"
            className="btn-primary btn-sm">
            Đăng nhập Portal →
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #060f1e 0%, #0d1e3a 40%, #1F3A68 100%)"
      }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px"}}
        />
        {/* Red accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-ulaw" />

        <div className="relative max-w-7xl mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-3xl">
            {!config?.maintenanceMode && (
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full mb-6 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống đang hoạt động · Học kỳ I – 2026
              </div>
            )}
            {config?.maintenanceMode && (
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-200 text-xs px-3 py-1.5 rounded-full mb-6 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Hệ thống đang bảo trì · Dự kiến quay lại sau 2h
              </div>
            )}

            <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight" style={{fontFamily: '"Source Serif Pro", serif'}}>
              {heroTitle}<br/>
              <span className="text-ulaw-light">{heroSubtitle}</span>
            </h1>

            <p className="text-white/70 text-lg mb-8 leading-relaxed max-w-xl">
              {config?.siteDescription || "Hệ thống quản lý học tập chuyên nghiệp cho lớp Văn bằng 2 Luật từ xa đầu tiên của Trường ĐH Luật TP.HCM — tích hợp LMS, thư viện pháp luật và AI hỗ trợ học tập."}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/login"
                className="btn-primary btn-lg">
                Vào Portal học tập →
              </Link>
              <a href="https://www.hcmulaw.edu.vn" target="_blank" rel="noopener"
                className="btn btn-lg border border-white/30 text-white hover:bg-white/10">
                hcmulaw.edu.vn ↗
              </a>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Access ───────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {quickLinks.map(l => (
              <Link key={l.label} href={l.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200
                           text-sm font-medium text-slate-700 hover:border-navy hover:text-navy
                           transition-colors shadow-sm">
                <span>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Announcements ──────────────────────────────────── */}
      <section id="announcements" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-ulaw text-xs font-semibold uppercase tracking-widest mb-3">Tin mới nhất</div>
              <h2 className="text-3xl font-extrabold text-navy-dark" style={{fontFamily: '"Source Serif Pro", serif'}}>
                Thông báo từ nhà trường
              </h2>
            </div>
            <Link href="/portal/announcements" className="text-navy font-bold text-sm hover:underline">
              Xem tất cả →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {announcements.map(ann => (
              <Link key={ann.id} href={`/portal/announcements/${ann.id}`} className="card p-6 hover:shadow-card-hover transition-all border-l-4 border-l-navy group">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  {new Date(ann.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <h3 className="font-bold text-navy-dark group-hover:text-navy transition-colors mb-2 line-clamp-2">
                  {ann.title}
                </h3>
                <span className="tag-default text-[10px]">{ann.tag}</span>
              </Link>
            ))}
            {announcements.length === 0 && (
              <div className="col-span-3 text-center py-10 bg-slate-50 rounded-2xl text-slate-400 italic">
                Chưa có thông báo mới.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-ulaw text-xs font-semibold uppercase tracking-widest mb-3">
              <div className="w-6 h-0.5 bg-ulaw" /> Grade A LMS <div className="w-6 h-0.5 bg-ulaw" />
            </div>
            <h2 className="text-3xl font-extrabold text-navy-dark" style={{fontFamily: '"Source Serif Pro", serif'}}>
              Nền tảng học tập toàn diện
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Được xây dựng theo tiêu chuẩn Canvas LMS, dành riêng cho sinh viên luật học từ xa,
              kết hợp với bản sắc học thuật của Trường ĐH Luật TP.HCM.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="card bg-white p-6 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-navy/8 flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-navy-dark mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ────────────────────────────────────────── */}
      <section id="courses" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-ulaw text-xs font-semibold uppercase tracking-widest mb-3">
              <div className="w-6 h-0.5 bg-ulaw" /> Chương trình học <div className="w-6 h-0.5 bg-ulaw" />
            </div>
            <h2 className="text-3xl font-extrabold text-navy-dark" style={{fontFamily: '"Source Serif Pro", serif'}}>
              Môn học đang diễn ra
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <div key={c.id} className="card p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-navy/8 flex items-center justify-center text-2xl shrink-0">
                  {c.icon || "⚖️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                    {c.code} · {c.credits} tín chỉ
                  </div>
                  <div className="font-bold text-navy-dark text-sm mt-0.5 leading-tight">{c.name}</div>
                  <span className="badge-green text-[10px] mt-2">Đang học</span>
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="col-span-3 text-center py-10 text-slate-400 italic">
                Chưa có dữ liệu môn học.
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/login" className="btn-primary">
              Đăng nhập để học →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-10" style={{background: "linear-gradient(135deg, #0d1e3a 0%, #1F3A68 100%)"}}>
            <div className="w-14 h-14 rounded-2xl bg-ulaw/20 flex items-center justify-center text-3xl mx-auto mb-5">
              🏛️
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3" style={{fontFamily: '"Source Serif Pro", serif'}}>
              Sẵn sàng học tập chuyên nghiệp?
            </h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Đăng nhập bằng tài khoản được cấp hoặc email Gmail đã đăng ký để truy cập toàn bộ
              hệ thống học tập, thư viện pháp luật và tài nguyên lớp.
            </p>
            <Link href="/login" className="btn-danger btn-lg inline-flex">
              Đăng nhập ngay →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-navy-dark text-white/60 text-xs py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-sm mb-1">{siteName} Learning Management System</div>
            <div>Trường Đại học Luật TP. Hồ Chí Minh · Lớp Văn bằng 2 từ xa Khóa 1 · 2026</div>
          </div>
          <div className="flex gap-4">
            <a href="https://www.hcmulaw.edu.vn" target="_blank" rel="noopener" className="hover:text-white transition-colors">Website ULAW</a>
            <a href="http://elearning.hcmulaw.edu.vn" target="_blank" rel="noopener" className="hover:text-white transition-colors">eLearning</a>
            <Link href="/login" className="hover:text-white transition-colors">Đăng nhập</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
