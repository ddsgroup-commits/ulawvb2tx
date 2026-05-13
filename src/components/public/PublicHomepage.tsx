import Link from "next/link";
import {
  GraduationCap, ChevronRight, CalendarDays, Megaphone, BookOpen,
  Pin, Scale, Users, Rocket, Lock, ShieldCheck,
  FileText, Brain, Video, FolderTree, ExternalLink, Facebook
} from "lucide-react";
import { TAG_LABELS, formatDateVi, daysUntil, truncate, cn } from "@/lib/utils";
import type { Announcement, Event, Course, AnnouncementTag, EventType } from "@prisma/client";

/* ──────────────────────────────────────────────────────────
   Public landing page for the ULAW VB2 portal.
   Server component. Receives pre-fetched DB data as props.
   ────────────────────────────────────────────────────────── */

type AnnouncementWithAuthor = Announcement & { author: { name: string | null } };

export type PublicHomepageProps = {
  announcements: AnnouncementWithAuthor[];
  weekEvents: Event[];
  deadlines: Event[];
  courses: Pick<Course, "id" | "slug" | "code" | "name" | "icon" | "credits" | "description">[];
  totals: {
    announcements: number;
    courses: number;
    credits: number;
    weekEvents: number;
    nextDeadline: Event | null;
  };
  lastUpdated: Date;
};

/* ULAW campus imagery (publicly hosted on hcmulaw.edu.vn) */
const PHOTOS = [
  { url: "https://www.hcmulaw.edu.vn/Temp/ArticleImage/69aceea8-80bf-4efc-9480-88b4bb63083b-TOAN9772-37.JPG",  cap: "Hội thảo học thuật" },
  { url: "https://www.hcmulaw.edu.vn/Temp/ArticleImage/8e88ec8d-be74-47f7-9480-fd91e2a89fca-base64-17784130017762120232629-52.jpeg", cap: "Sinh viên ULAW" },
  { url: "https://www.hcmulaw.edu.vn/Temp/ArticleImage/049125d8-fee6-439e-abc2-c43e152be335-z7802699112511_83ea8ab46dae8dcb4cfc965a1e3108dd%20copy-29.jpg", cap: "Hội nghị toàn trường" },
  { url: "https://www.hcmulaw.edu.vn/Temp/ArticleImage/dc82f4e2-1414-4ea8-b6a8-b68ef08b7a97-(01)-0.jpg", cap: "Hướng nghiệp" },
  { url: "https://www.hcmulaw.edu.vn/Temp/ArticleImage/1ec5fb49-ca9e-40f2-a1af-c57788410894-9%20(6)-55.jpg", cap: "Hợp tác quốc tế" },
  { url: "https://www.hcmulaw.edu.vn/Temp/ArticleImage/fb5b3a47-842f-4dc0-b218-652e4da0a318-TOAN9830%20copy-10.JPG", cap: "Khán phòng A" },
];
const HERO_IMG = PHOTOS[5].url;
const FEATURE_IMG = PHOTOS[4].url;

const EVENT_DOT: Record<EventType, string> = {
  CLASS: "bg-blue-100 text-blue-700",
  EXAM: "bg-red-100 text-red-700",
  DEADLINE: "bg-amber-100 text-amber-700",
  EVENT: "bg-purple-100 text-purple-700",
};

const TAG_DOT: Record<AnnouncementTag, string> = {
  LICH_HOC: "text-blue-700",
  DEADLINE: "text-amber-700",
  THAY_DOI: "text-orange-700",
  THI_CU: "text-red-700",
  CHUNG_CHI: "text-green-700",
  KHAC: "text-slate-600",
};

const COURSE_ICONS: Record<string, string> = {
  "LLNN-NN": "⚖", "LLNN-PL": "📖", "LHP": "📜",
  "LHC": "🏛", "DS-TS-TK": "📘", "LGH": "🧠",
};

export function PublicHomepage(props: PublicHomepageProps) {
  const { announcements, weekEvents, deadlines, courses, totals, lastUpdated } = props;

  return (
    <div className="bg-white text-slate-800">
      <Header />

      <main>
        <Hero lastUpdated={lastUpdated} />

        {/* Stats band */}
        <section className="relative z-10">
          <div className="max-w-7xl mx-auto px-5">
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 rounded-md shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <StatCard num={totals.courses || 6} label="Môn học học kỳ I" sub={`Tổng ${totals.credits} tín chỉ`} divider />
              <StatCard
                num={totals.announcements}
                label="Thông báo đang hiển thị"
                sub={`${announcements.length} mới gần đây`}
                divider
              />
              <StatCard num={totals.weekEvents} label="Sự kiện trong tuần" sub="lịch học · thi · deadline" divider />
              <StatCard
                num={totals.nextDeadline ? Math.max(0, daysUntil(totals.nextDeadline.date)) : "—"}
                label="Ngày đến deadline gần nhất"
                sub={totals.nextDeadline ? truncate(totals.nextDeadline.title, 38) : "Không có deadline"}
              />
            </div>
          </div>
        </section>

        <QuickAccess />

        {/* Featured stories */}
        <Section>
          <SectionHead
            eyebrow="Tin nổi bật"
            title="Cập nhật từ Nhà trường & lớp học"
            more={{ href: "/login?callbackUrl=/announcements", label: "Tất cả thông báo →" }}
          />
          <StoriesGrid announcements={announcements} />
        </Section>

        {/* Feature banner */}
        <FeatureBanner />

        {/* Upcoming split */}
        <Section className="bg-slate-50 border-y border-slate-100">
          <SectionHead
            eyebrow="Tuần này & sắp tới"
            title="Buổi học, kỳ thi và deadline gần nhất"
            more={{ href: "/login?callbackUrl=/schedule", label: "Mở lịch đầy đủ →" }}
          />
          <div className="grid lg:grid-cols-2 gap-6">
            <UpcomingPanel
              title="Sự kiện tuần này"
              icon={<CalendarDays size={18} />}
              events={weekEvents}
              accent="navy"
              emptyText="Không có sự kiện trong tuần này."
            />
            <UpcomingPanel
              title="Deadline sắp tới"
              icon={<Megaphone size={18} />}
              events={deadlines}
              accent="red"
              emptyText="🎉 Chưa có deadline sắp tới."
            />
          </div>
        </Section>

        {/* Courses */}
        <Section>
          <SectionHead
            eyebrow="Học kỳ I · Năm 2026"
            title="Sáu môn học nền tảng"
            more={{ href: "/login?callbackUrl=/courses", label: "Trang môn học →" }}
          />
          <CoursesGrid courses={courses} />
        </Section>

        {/* Pillars on navy */}
        <section className="bg-gradient-to-b from-navy-dark to-navy text-white">
          <div className="max-w-7xl mx-auto px-5 py-16">
            <div className="mb-7 pb-4 border-b border-white/15">
              <div className="text-xs tracking-[0.14em] uppercase font-bold text-gold mb-2">
                Định hướng của lớp
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
                Một cộng đồng học tập chuyên nghiệp
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-7">
              <Pillar icon={<Scale className="text-gold" size={32} />} title="Chuẩn mực pháp lý">
                Nội dung và tài liệu trích dẫn từ giáo trình chính thức của ULAW, văn bản pháp luật hợp pháp, cập nhật đến năm 2026.
              </Pillar>
              <Pillar icon={<Users className="text-gold" size={32} />} title="Hỗ trợ lẫn nhau">
                Năm nhóm học tập luân phiên trực Zoom, ghi chú nội dung và lưu lên Drive lớp — không ai bị bỏ lại phía sau.
              </Pillar>
              <Pillar icon={<Rocket className="text-gold" size={32} />} title="Tiên phong từ xa">
                Lớp Văn bằng 2 từ xa đầu tiên của ULAW — kết hợp nghiêm túc học thuật và linh hoạt công nghệ (Zoom, NotebookLM, Drive).
              </Pillar>
            </div>
          </div>
        </section>

        {/* Resources */}
        <Section className="bg-slate-50 border-y border-slate-100">
          <SectionHead
            eyebrow="Học liệu & Công cụ"
            title="Mọi tài nguyên học tập — trong một nơi"
            more={{ href: "/login?callbackUrl=/library", label: "Mở thư viện →" }}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <ResourceCard href="/login?callbackUrl=/videos" icon={<Video size={28} />} title="Video bài giảng" accent="ulaw-red">
              Xem lại buổi học Zoom, video tóm tắt từng môn — nhúng YouTube và Google Drive trực tiếp.
            </ResourceCard>
            <ResourceCard href="/login?callbackUrl=/library" icon={<FolderTree size={28} />} title="Thư viện tài liệu" accent="navy">
              Văn bản pháp luật, giáo trình, đề thi mẫu — tổng hợp từ thư viện ULAW và bộ sưu tập lớp.
            </ResourceCard>
            <ResourceCard href="/login?callbackUrl=/ai-hub" icon={<Brain size={28} />} title="AI Study Hub" accent="gold">
              NotebookLM của Google cho từng môn học — đặt câu hỏi và ôn tập với chính tài liệu lớp.
            </ResourceCard>
            <ResourceCard href="/login?callbackUrl=/schedule" icon={<CalendarDays size={28} />} title="Lịch học & Deadline" accent="navy">
              Lịch tuần, lịch học cả kỳ, kỳ thi, deadline — đồng bộ với Google Calendar của lớp.
            </ResourceCard>
          </div>
        </Section>

        {/* Photo grid */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-5 mb-6">
            <div className="flex justify-between items-end gap-4 pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs tracking-[0.14em] uppercase font-bold text-ulaw-red mb-1.5">
                  Cuộc sống ULAW
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-navy-dark">
                  Khoảnh khắc từ Nhà trường
                </h2>
              </div>
              <a
                href="https://www.facebook.com/hcmulaw"
                target="_blank"
                rel="noopener"
                className="text-sm font-bold text-navy hover:text-ulaw-red inline-flex items-center gap-1.5"
              >
                <Facebook size={14} /> Facebook ULAW →
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 max-w-[1440px] mx-auto">
            {PHOTOS.slice(0, 4).map((p, i) => (
              <a
                key={i}
                href="https://www.hcmulaw.edu.vn"
                target="_blank"
                rel="noopener"
                className="group relative block aspect-square overflow-hidden"
                style={{ backgroundImage: `url('${p.url}')`, backgroundSize: "cover", backgroundPosition: "center" }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/65 group-hover:from-black/15 group-hover:to-black/75 transition-all" />
                <span className="absolute left-3.5 bottom-3 right-3.5 text-white text-sm font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] z-10">
                  {p.cap}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Portal login CTA */}
        <PortalCTA />

        {/* Zalo CTA */}
        <section className="bg-slate-50 border-t border-slate-200 py-14">
          <div className="max-w-2xl mx-auto px-5 text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-navy-dark mb-2">
              Đăng ký vào nhóm Zalo lớp
            </h2>
            <p className="text-slate-600 mb-5 leading-relaxed">
              Nhận thông báo nóng, đổi lịch, đề thi mẫu trực tiếp qua nhóm Zalo nội bộ — kênh dự phòng cho cổng thông tin này.
            </p>
            <a
              href="https://zalo.me/g/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-navy text-navy font-bold rounded hover:bg-navy hover:text-white transition-colors"
            >
              Mở nhóm Zalo <ExternalLink size={16} />
            </a>
          </div>
        </section>
      </main>

      <Footer lastUpdated={lastUpdated} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Section primitives
   ────────────────────────────────────────────────────────── */

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("py-16", className)}>
      <div className="max-w-7xl mx-auto px-5">{children}</div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  more,
}: {
  eyebrow: string;
  title: string;
  more?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-7 pb-3.5 border-b border-slate-200">
      <div>
        <div className="text-xs tracking-[0.14em] uppercase font-bold text-ulaw-red mb-1.5">
          {eyebrow}
        </div>
        <h2 className="font-serif text-2xl md:text-3xl text-navy-dark leading-tight">{title}</h2>
      </div>
      {more && (
        <Link
          href={more.href}
          className="text-sm font-bold text-navy hover:text-ulaw-red whitespace-nowrap"
        >
          {more.label}
        </Link>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Header — utility bar + main nav with Login CTA
   ────────────────────────────────────────────────────────── */

function Header() {
  return (
    <>
      <div className="bg-navy-dark text-white/85 text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-1.5 flex flex-wrap justify-between items-center gap-3">
          <span>🏛 Trường Đại học Luật TP. Hồ Chí Minh · Lớp Văn bằng 2 từ xa – Khóa 1</span>
          <div className="flex gap-4">
            <a href="https://www.hcmulaw.edu.vn" target="_blank" rel="noopener" className="hover:text-white">
              hcmulaw.edu.vn
            </a>
            <a href="https://daotao.hcmulaw.edu.vn" target="_blank" rel="noopener" className="hover:text-white">
              Cổng đào tạo
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-nav">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">UL</span>
            </div>
            <div className="leading-tight">
              <div className="font-bold text-navy-dark text-[15px]">ULAW VB2 · Class Portal</div>
              <div className="text-[11.5px] text-slate-500">Văn bằng 2 Luật từ xa – Khóa 1</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <a href="#stories" className="px-3 py-2 text-slate-700 hover:text-navy font-medium">Tin tức</a>
            <a href="#upcoming" className="px-3 py-2 text-slate-700 hover:text-navy font-medium">Lịch học</a>
            <a href="#courses" className="px-3 py-2 text-slate-700 hover:text-navy font-medium">Môn học</a>
            <a href="#resources" className="px-3 py-2 text-slate-700 hover:text-navy font-medium">Tài liệu</a>
            <a href="#about" className="px-3 py-2 text-slate-700 hover:text-navy font-medium">Về lớp</a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-ulaw-red text-white text-sm font-bold hover:bg-ulaw-red-dark transition-colors"
          >
            <Lock size={14} /> Đăng nhập
          </Link>
        </div>
      </header>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Hero
   ────────────────────────────────────────────────────────── */

function Hero({ lastUpdated }: { lastUpdated: Date }) {
  return (
    <section className="relative min-h-[560px] flex items-end text-white overflow-hidden isolate">
      <div
        className="absolute inset-0 -z-20 scale-105 saturate-[0.92]"
        style={{
          backgroundImage: `url('${HERO_IMG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(15,25,50,0.20)] via-[rgba(15,25,50,0.55)] to-[rgba(15,25,50,0.85)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgba(15,25,50,0.55)] via-transparent to-transparent" />

      <div className="max-w-7xl w-full mx-auto px-5 pt-24 pb-14 md:pt-28 md:pb-16">
        <span className="inline-block text-xs tracking-[0.14em] uppercase font-bold text-gold border-b-2 border-gold pb-1.5 mb-4">
          Class Portal · K1 · Niên khóa 2026
        </span>
        <h1 className="font-serif font-bold leading-[1.08] text-4xl md:text-6xl max-w-3xl mb-4 drop-shadow-[0_2px_24px_rgba(0,0,0,0.25)]">
          Văn bằng 2 Luật từ xa.
          <br />
          Học thuật chuẩn mực. Cộng đồng tiên phong.
        </h1>
        <p className="max-w-xl text-[1.05rem] leading-relaxed text-white/90 mb-7">
          Trung tâm thông tin duy nhất cho lớp Văn bằng 2 Luật từ xa đầu tiên của Trường ĐH Luật TP.HCM —
          kết nối lịch học, tài liệu, thông báo và cộng đồng học tập trong một nền tảng được thiết kế
          chuyên nghiệp, bảo mật và dễ dùng.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded bg-ulaw-red hover:bg-ulaw-red-dark text-white font-bold tracking-wide"
          >
            <ShieldCheck size={18} /> Vào cổng thông tin lớp
          </Link>
          <a
            href="#upcoming"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded border-2 border-white/60 hover:border-white hover:bg-white/10 text-white font-bold tracking-wide"
          >
            <CalendarDays size={18} /> Lịch học & thông báo
          </a>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 bg-[rgba(15,25,50,0.55)] backdrop-blur-sm border-t border-white/10 text-xs text-white/85">
        <div className="max-w-7xl mx-auto px-5 py-2.5 flex flex-wrap justify-between items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            <strong className="font-semibold">Đang cập nhật</strong> · Last updated {formatDateVi(lastUpdated, "dd 'tháng' MM, yyyy")}
          </span>
          <span>📸 Ảnh: Trường ĐH Luật TP.HCM</span>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Stats
   ────────────────────────────────────────────────────────── */

function StatCard({
  num, label, sub, divider,
}: { num: React.ReactNode; label: string; sub: string; divider?: boolean }) {
  return (
    <div className={cn("p-6", divider && "md:border-r border-slate-200")}>
      <div className="font-serif text-4xl font-bold text-navy-dark leading-none mb-2">{num}</div>
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Quick access pills
   ────────────────────────────────────────────────────────── */

function QuickAccess() {
  const links: { href: string; emoji: string; label: string }[] = [
    { href: "/login?callbackUrl=/announcements", emoji: "📢", label: "Thông báo" },
    { href: "/login?callbackUrl=/schedule",      emoji: "📅", label: "Lịch học & deadline" },
    { href: "/login?callbackUrl=/courses",       emoji: "📚", label: "6 môn học" },
    { href: "/login?callbackUrl=/videos",        emoji: "🎬", label: "Video bài giảng" },
    { href: "/login?callbackUrl=/library",       emoji: "🗂", label: "Thư viện tài liệu" },
    { href: "/login?callbackUrl=/contacts",      emoji: "👥", label: "Danh bạ lớp" },
    { href: "/login?callbackUrl=/faq",           emoji: "❓", label: "FAQ" },
    { href: "/login",                            emoji: "🔐", label: "Đăng nhập Portal" },
  ];
  return (
    <section className="bg-slate-50 border-y border-slate-200 py-7 mt-12">
      <div className="max-w-7xl mx-auto px-5">
        <h3 className="font-serif text-lg text-navy-dark font-bold mb-3.5">Truy cập nhanh</h3>
        <div className="flex flex-wrap gap-2.5">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-navy px-3.5 py-2 rounded-full text-sm font-semibold hover:border-ulaw-red hover:text-ulaw-red transition-colors"
            >
              <span>{l.emoji}</span> {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Stories grid (announcements)
   ────────────────────────────────────────────────────────── */

function StoriesGrid({ announcements }: { announcements: AnnouncementWithAuthor[] }) {
  if (announcements.length === 0) {
    return (
      <div id="stories" className="py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
        Chưa có thông báo nào được đăng.
      </div>
    );
  }

  const [first, ...rest] = announcements;
  const small = rest.slice(0, 4);

  return (
    <div id="stories" className="grid lg:grid-cols-[1.4fr_1fr_1fr] gap-5 auto-rows-[minmax(180px,_auto)]">
      {first && (
        <Link
          href="/login?callbackUrl=/announcements"
          className="lg:row-span-2 flex flex-col bg-white border border-slate-200 rounded overflow-hidden hover:-translate-y-0.5 hover:shadow-card-hover transition-all"
        >
          <div
            className="aspect-[16/9] min-h-[260px] bg-slate-200"
            style={{ backgroundImage: `url('${PHOTOS[1].url}')`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="p-6 flex flex-col gap-2 flex-1">
            <div className={cn("text-[11.5px] tracking-[0.12em] uppercase font-bold flex items-center gap-2", TAG_DOT[first.tag])}>
              <span>{TAG_LABELS[first.tag]}</span>
              {first.pinned && <span className="inline-flex items-center gap-1 text-ulaw-red"><Pin size={11} /> Ghim</span>}
              {first.urgent && <span className="text-ulaw-red font-extrabold">· Khẩn</span>}
            </div>
            <div className="font-serif font-bold text-2xl text-navy-dark leading-snug">{first.title}</div>
            <p className="text-slate-600 text-sm leading-relaxed">{truncate(first.content, 200)}</p>
            <div className="text-xs text-slate-500 mt-auto pt-2">
              📅 {formatDateVi(first.createdAt, "dd 'tháng' MM, yyyy")} · <strong className="text-slate-700 font-semibold">{first.author.name ?? "BCS"}</strong>
            </div>
          </div>
        </Link>
      )}

      {small.map((a) => (
        <Link
          key={a.id}
          href="/login?callbackUrl=/announcements"
          className="grid grid-cols-[120px_1fr] bg-white border border-slate-200 rounded overflow-hidden hover:-translate-y-0.5 hover:shadow-card-hover transition-all"
        >
          <div
            className="bg-slate-200"
            style={{ backgroundImage: `url('${PHOTOS[(announcements.indexOf(a) + 1) % PHOTOS.length].url}')`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="p-4 flex flex-col gap-1.5">
            <div className={cn("text-[10.5px] tracking-[0.12em] uppercase font-bold", TAG_DOT[a.tag])}>
              {TAG_LABELS[a.tag]}{a.pinned ? " · Ghim" : ""}
            </div>
            <div className="font-serif font-bold text-base text-navy-dark leading-snug">
              {truncate(a.title, 80)}
            </div>
            <div className="text-[11.5px] text-slate-500 mt-auto">
              {formatDateVi(a.createdAt, "dd/MM/yyyy")} · {a.author.name ?? "BCS"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Feature banner
   ────────────────────────────────────────────────────────── */

function FeatureBanner() {
  return (
    <section
      id="about"
      className="relative text-white py-24 md:py-28 isolate"
      style={{ backgroundImage: `url('${FEATURE_IMG}')`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgba(15,25,50,0.88)] via-[rgba(15,25,50,0.55)] to-[rgba(15,25,50,0.30)]" />
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-xs tracking-[0.14em] uppercase font-bold text-gold mb-3">Tinh thần ULAW</div>
        <h2 className="font-serif text-3xl md:text-5xl text-white max-w-3xl leading-tight mb-4">
          Pháp luật – Kỷ cương – Tri thức – Phụng sự
        </h2>
        <p className="text-white/90 max-w-2xl leading-relaxed mb-6 text-[1.05rem]">
          Lớp Văn bằng 2 Luật từ xa khóa đầu tiên là một bước tiến tiên phong trong mô hình đào tạo
          của Trường ĐH Luật TP.HCM, hướng đến những người học trưởng thành, bận rộn nhưng vẫn quyết tâm
          theo đuổi tri thức pháp lý ở chuẩn mực cao nhất.
        </p>
        <Link
          href="/login?callbackUrl=/courses"
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded bg-ulaw-red hover:bg-ulaw-red-dark text-white font-bold"
        >
          Khám phá chương trình <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Upcoming panels
   ────────────────────────────────────────────────────────── */

function UpcomingPanel({
  title, icon, events, accent, emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  events: Event[];
  accent: "navy" | "red";
  emptyText: string;
}) {
  const accentClass = accent === "navy" ? "border-t-navy" : "border-t-ulaw-red";
  return (
    <div id={accent === "navy" ? "upcoming" : undefined}
         className={cn("bg-white rounded border border-slate-200 border-t-[3px] p-6", accentClass)}>
      <h3 className="font-serif text-lg text-navy-dark font-bold mb-3.5 flex items-center gap-2">
        {icon} {title}
      </h3>
      {events.length === 0 ? (
        <div className="py-4 text-sm text-slate-500">{emptyText}</div>
      ) : (
        <div className="divide-y divide-dashed divide-slate-200">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  const d = new Date(event.date);
  const day = d.getDate();
  const mon = d.toLocaleString("vi-VN", { month: "short" });
  return (
    <div className="grid grid-cols-[56px_1fr] gap-3.5 py-3">
      <div className={cn("text-center rounded p-2", EVENT_DOT[event.type])}>
        <div className="text-xl font-bold leading-none">{day}</div>
        <div className="text-[10.5px] uppercase tracking-wider mt-1 opacity-80">{mon}</div>
      </div>
      <div>
        <div className="font-semibold text-slate-800 text-sm leading-snug">{event.title}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          {event.time ? `⏰ ${event.time}` : ""}
          {event.room ? `${event.time ? " · " : ""}📍 ${event.room}` : ""}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Courses
   ────────────────────────────────────────────────────────── */

function CoursesGrid({ courses }: { courses: PublicHomepageProps["courses"] }) {
  if (courses.length === 0) {
    return (
      <div id="courses" className="py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
        Chưa có dữ liệu môn học. Hãy chạy <code className="bg-white px-1.5 py-0.5 rounded text-xs">npm run db:seed</code>.
      </div>
    );
  }
  return (
    <div id="courses" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((c) => {
        const icon = c.icon || COURSE_ICONS[c.code] || "📘";
        return (
          <Link
            key={c.id}
            href={`/login?callbackUrl=/courses/${c.slug}`}
            className="block bg-white rounded border border-slate-200 border-t-[3px] border-t-navy p-5 hover:border-t-ulaw-red hover:-translate-y-0.5 hover:shadow-card-hover transition-all"
          >
            <div className="text-3xl mb-1.5">{icon}</div>
            <h4 className="font-serif font-bold text-lg text-navy-dark leading-snug mb-1">{c.name}</h4>
            <div className="text-xs text-slate-500 border-b border-slate-200 pb-2.5 mb-2.5">
              {c.code} · {c.credits} tín chỉ
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {c.description ? truncate(c.description, 140) : "Môn học thuộc chương trình Văn bằng 2 Luật."}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Pillar card (on navy band)
   ────────────────────────────────────────────────────────── */

function Pillar({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 border-l-[3px] border-l-gold rounded p-6">
      <div className="mb-3">{icon}</div>
      <h4 className="font-serif font-bold text-xl text-white mb-2 leading-snug">{title}</h4>
      <p className="text-white/85 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Resource card
   ────────────────────────────────────────────────────────── */

function ResourceCard({
  href, icon, title, accent, children,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  accent: "navy" | "ulaw-red" | "gold";
  children: React.ReactNode;
}) {
  const accentClass = {
    "navy": "border-t-navy",
    "ulaw-red": "border-t-ulaw-red",
    "gold": "border-t-gold",
  }[accent];
  return (
    <Link
      id="resources"
      href={href}
      className={cn(
        "block bg-white border border-slate-200 border-t-[3px] rounded p-5 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-t-ulaw-red transition-all",
        accentClass
      )}
    >
      <div className="text-navy mb-2.5">{icon}</div>
      <h3 className="font-serif font-bold text-lg text-navy-dark mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────
   Portal-login CTA block
   ────────────────────────────────────────────────────────── */

function PortalCTA() {
  return (
    <section className="bg-gradient-to-br from-navy-dark to-navy text-white py-16 border-t-4 border-ulaw-red">
      <div className="max-w-2xl mx-auto px-5 text-center">
        <Lock className="mx-auto text-gold mb-3" size={36} />
        <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">Cổng thông tin nội bộ lớp</h2>
        <p className="text-white/85 text-[1.02rem] leading-relaxed mb-6 max-w-xl mx-auto">
          Đăng nhập để truy cập lịch học, thông báo, 6 môn học, video bài giảng, AI Study Hub, thư viện tài liệu, danh bạ và FAQ — tất cả trong một nền tảng bảo mật.
        </p>
        <div className="inline-block bg-white/[0.06] border border-white/15 border-l-[3px] border-l-gold rounded text-left px-5 py-3.5 mb-6 max-w-md">
          <div className="text-[11.5px] tracking-[0.12em] uppercase font-bold text-gold mb-1.5">
            Cách đăng nhập lần đầu
          </div>
          <div className="text-sm leading-relaxed">
            <strong className="font-semibold">Tên đăng nhập:</strong> MSSV (mã số sinh viên, 13 chữ số)
            <br />
            <strong className="font-semibold">Mật khẩu:</strong> tên gọi viết thường, không dấu
            <br />
            <span className="opacity-60 text-xs">VD: MSSV 2543801010228 → mật khẩu &quot;linh&quot;</span>
          </div>
        </div>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold hover:bg-gold-dark text-navy-dark font-extrabold rounded shadow-lg transition-colors"
          >
            <GraduationCap size={20} /> Vào Portal lớp học
          </Link>
        </div>
        <div className="mt-4 text-xs text-white/55">
          Quên mật khẩu? Liên hệ Ban cán sự lớp qua nhóm Zalo.
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Footer
   ────────────────────────────────────────────────────────── */

function Footer({ lastUpdated }: { lastUpdated: Date }) {
  return (
    <footer className="bg-navy-dark text-white/75 text-sm">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="bg-white/[0.04] border border-white/10 px-4 py-3 rounded mb-6 text-xs leading-relaxed text-white/70">
          ⚖ Website này là cổng thông tin nội bộ phục vụ lớp học, không thay thế hệ thống LMS,
          cổng sinh viên hoặc thông báo chính thức của Trường ĐH Luật TP.HCM.
          Mọi thông tin học vụ chính thống vui lòng tham chiếu từ Phòng Đào tạo.
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7 mb-6">
          <div>
            <h4 className="text-white font-bold mb-2.5">ULAW VB2 K1</h4>
            <p className="text-xs leading-relaxed">
              Lớp Văn bằng 2 Luật từ xa khóa đầu tiên của Trường ĐH Luật TP.HCM.
            </p>
            <p className="text-xs mt-2">
              Cập nhật lần cuối: <strong className="text-white/90">{formatDateVi(lastUpdated, "dd/MM/yyyy")}</strong>
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2.5">Cổng thông tin</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/login" className="hover:text-white">Đăng nhập</Link></li>
              <li><Link href="/login?callbackUrl=/announcements" className="hover:text-white">Thông báo</Link></li>
              <li><Link href="/login?callbackUrl=/schedule" className="hover:text-white">Lịch học</Link></li>
              <li><Link href="/login?callbackUrl=/courses" className="hover:text-white">Môn học</Link></li>
              <li><Link href="/login?callbackUrl=/library" className="hover:text-white">Thư viện</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2.5">Trường ĐH Luật TP.HCM</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="https://www.hcmulaw.edu.vn" target="_blank" rel="noopener" className="hover:text-white">hcmulaw.edu.vn</a></li>
              <li><a href="https://daotao.hcmulaw.edu.vn" target="_blank" rel="noopener" className="hover:text-white">Cổng đào tạo</a></li>
              <li><a href="https://www.facebook.com/hcmulaw" target="_blank" rel="noopener" className="hover:text-white">Facebook ULAW</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2.5">Hỗ trợ</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/login?callbackUrl=/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/login?callbackUrl=/contacts" className="hover:text-white">Ban cán sự lớp</Link></li>
              <li><a href="https://zalo.me/g/" target="_blank" rel="noopener" className="hover:text-white">Nhóm Zalo lớp</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 flex flex-wrap justify-between gap-3 text-xs text-white/55">
          <span>© {new Date().getFullYear()} ULAW VB2 K1 · Cổng thông tin nội bộ lớp.</span>
          <span>Built with Next.js + Prisma · Hosted by ULAW VB2.</span>
        </div>
      </div>
    </footer>
  );
}
