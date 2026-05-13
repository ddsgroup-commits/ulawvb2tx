import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { ExternalLink, Brain, BookOpen, Sparkles, MessageSquare, Mic, FileText } from "lucide-react";

export const metadata: Metadata = { title: "AI Study Hub – NotebookLM" };

const COURSE_THEMES: Record<string, { gradient: string; accent: string }> = {
  LLNN:  { gradient: "from-navy    to-navy-dark",    accent: "#c9a84c" },
  HP:    { gradient: "from-red-700  to-red-900",      accent: "#fca5a5" },
  HC:    { gradient: "from-blue-700 to-blue-900",     accent: "#93c5fd" },
  DS:    { gradient: "from-emerald-700 to-emerald-900", accent: "#6ee7b7" },
  LOGIC: { gradient: "from-purple-700 to-purple-900", accent: "#c4b5fd" },
  LLPL:  { gradient: "from-amber-700 to-amber-900",   accent: "#fde68a" },
};

const NOTEBOOK_DESCRIPTIONS: Record<string, string> = {
  LLNN:  "Bản chất, chức năng, hình thức Nhà nước. Nhà nước CHXHCN Việt Nam trong hệ thống pháp lý.",
  HP:    "Hiến pháp 2013, bộ máy nhà nước, quyền con người, quyền công dân cơ bản.",
  HC:    "Quan hệ hành chính, quyết định hành chính, xử phạt VPHC, khiếu nại tố cáo.",
  DS:    "Năng lực pháp luật dân sự, giao dịch, quyền tài sản, thừa kế, bồi thường.",
  LOGIC: "Tư duy lô-gic trong lập luận, suy diễn pháp lý, xây dựng lập luận có căn cứ.",
  LLPL:  "Hệ thống pháp luật, nguồn luật, giải thích và áp dụng pháp luật.",
};

export default async function AiHubPage() {
  const courses = await prisma.course.findMany({
    where:   { notebooklmUrl: { not: null } },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-dark to-navy p-6 sm:p-8 text-white overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-gold/10 translate-y-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-gold" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-gold">AI Study Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Học với AI – NotebookLM
          </h1>
          <p className="text-white/70 mt-2 text-sm sm:text-base max-w-lg leading-relaxed">
            Mỗi môn học có một Notebook riêng được nạp đầy đủ giáo trình, văn bản pháp luật và
            tài liệu học tập. Đặt câu hỏi, tóm tắt, luyện thi — tất cả bằng tiếng Việt.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: MessageSquare, text: "Đặt câu hỏi tự do" },
              { icon: FileText,      text: "Tóm tắt bài học" },
              { icon: Mic,           text: "Podcast AI" },
              { icon: Sparkles,      text: "Flashcard thông minh" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs text-white/90">
                <Icon className="w-3.5 h-3.5 text-gold" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Notebooks Grid ───────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-navy" />
          <h2 className="font-bold text-navy-dark">{courses.length} Notebook cho {courses.length} môn học</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => {
            const theme = COURSE_THEMES[course.code] ?? COURSE_THEMES["LLNN"];
            const desc  = NOTEBOOK_DESCRIPTIONS[course.code] ?? course.description;

            return (
              <div
                key={course.id}
                className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover
                           transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
              >
                {/* Card header gradient */}
                <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-5 pb-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{course.icon ?? "📚"}</div>
                    <span
                      className="badge text-[10px] font-bold px-2 py-1"
                      style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
                    >
                      {course.code}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {course.name}
                  </h3>
                  <div className="text-white/60 text-xs mt-1">{course.credits} tín chỉ</div>
                </div>

                {/* Card body */}
                <div className="bg-white flex-1 px-5 py-4 flex flex-col gap-3">
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {desc}
                  </p>

                  {/* What's inside */}
                  <div className="flex flex-wrap gap-1.5">
                    {["Giáo trình", "Văn bản PL", "Q&A AI", "Podcast"].map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <a
                    href={course.notebooklmUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center gap-2 w-full
                               bg-navy text-white text-sm font-semibold
                               py-2.5 rounded-xl hover:bg-navy-dark transition-colors
                               group-hover:shadow-md"
                  >
                    <Brain className="w-4 h-4" />
                    Mở NotebookLM
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── How to use guide ─────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-gold" />
          <h2 className="font-bold text-navy-dark">Cách học hiệu quả với NotebookLM</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Chọn môn học",
              desc:  "Nhấn 'Mở NotebookLM' của môn bạn cần ôn. Đăng nhập bằng tài khoản Google.",
              color: "bg-navy/8 text-navy",
            },
            {
              step: "02",
              title: "Đặt câu hỏi",
              desc:  "Hỏi bằng tiếng Việt tự nhiên. Ví dụ: 'Năng lực hành vi dân sự là gì? Cho ví dụ'",
              color: "bg-blue-50 text-blue-700",
            },
            {
              step: "03",
              title: "Tạo tài liệu ôn thi",
              desc:  "Yêu cầu AI tạo bộ flashcard, tóm tắt chương, câu hỏi thi thử theo từng chủ đề.",
              color: "bg-emerald-50 text-emerald-700",
            },
            {
              step: "04",
              title: "Nghe Podcast",
              desc:  "Dùng tính năng Audio Overview để nghe tóm tắt môn học khi di chuyển.",
              color: "bg-amber-50 text-amber-700",
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${color}`}>
                {step}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">{title}</div>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-5 bg-gold/10 border border-gold/20 rounded-xl px-4 py-3">
          <div className="text-xs font-bold text-amber-800 mb-2">💡 Gợi ý câu hỏi hay nhất</div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {[
              "\"Phân biệt năng lực pháp luật và năng lực hành vi dân sự\"",
              "\"Liệt kê các trường hợp giao dịch dân sự vô hiệu theo BLDS 2015\"",
              "\"Tóm tắt chương thừa kế theo pháp luật trong 5 điểm chính\"",
              "\"Tạo 10 câu hỏi trắc nghiệm về Luật Hành chính để ôn thi\"",
              "\"Bản chất pháp lý của quyết định hành chính là gì?\"",
              "\"So sánh thừa kế theo di chúc và theo pháp luật\"",
            ].map(q => (
              <div key={q} className="text-xs text-amber-700 bg-white/60 rounded-lg px-3 py-2 italic">
                {q}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
