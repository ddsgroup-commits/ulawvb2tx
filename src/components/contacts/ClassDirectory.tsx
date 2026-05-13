"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, GraduationCap, Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DirectoryEntry {
  id: string;
  studentId: string | null;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "CREATOR" | "STUDENT" | "PENDING_USER";
  isViewerAdmin: boolean;
  /** Only included for admin viewers — students never see classmate emails. */
  email?: string;
}

interface Props {
  entries: DirectoryEntry[];
  /** Whether the viewer is admin — controls whether emails are shown. */
  viewerIsAdmin: boolean;
}

// Vietnamese-aware "given name" extractor — last whitespace-separated word.
function givenName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] || full;
}

// Diacritic-insensitive lowercasing for grouping ("Đ" → "d").
function normaliseFold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

const ROLE_BADGE: Record<DirectoryEntry["role"], { label: string; class: string; Icon: typeof Crown }> = {
  SUPER_ADMIN:  { label: "Quản trị cao nhất",   class: "bg-red-100 text-red-700",       Icon: Crown },
  ADMIN:        { label: "Admin lớp",            class: "bg-navy/10 text-navy",          Icon: ShieldCheck },
  MODERATOR:    { label: "Kiểm duyệt viên",     class: "bg-purple-100 text-purple-700", Icon: ShieldCheck },
  CREATOR:      { label: "Người tạo nội dung",  class: "bg-blue-100 text-blue-700",     Icon: ShieldCheck },
  STUDENT:      { label: "Sinh viên",            class: "bg-slate-100 text-slate-600",   Icon: GraduationCap },
  PENDING_USER: { label: "Chờ phê duyệt",        class: "bg-amber-100 text-amber-700",   Icon: GraduationCap },
};

export function ClassDirectory({ entries, viewerIsAdmin }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = normaliseFold(query);
    return entries.filter((e) => {
      const hayName = normaliseFold(e.name);
      const hayMssv = (e.studentId ?? "").toLowerCase();
      return hayName.includes(q) || hayMssv.includes(q);
    });
  }, [entries, query]);

  // Partition: admins first (highlighted), then members alphabetised by given name.
  const admins = filtered.filter((e) => e.role === "SUPER_ADMIN" || e.role === "ADMIN");
  const lecturers = filtered.filter((e) => e.role === "MODERATOR" || e.role === "CREATOR");
  const members = filtered
    .filter((e) => e.role === "STUDENT")
    .sort((a, b) =>
      normaliseFold(givenName(a.name)).localeCompare(
        normaliseFold(givenName(b.name)),
        "vi",
        { sensitivity: "base" },
      ),
    );

  // Group members by first letter of given name for an alphabetical jump-list.
  const memberGroups = useMemo(() => {
    const m = new Map<string, DirectoryEntry[]>();
    for (const e of members) {
      const letter = normaliseFold(givenName(e.name))[0]?.toUpperCase() ?? "?";
      (m.get(letter) ?? m.set(letter, []).get(letter)!).push(e);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b, "vi"));
  }, [members]);

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc MSSV (gõ không dấu cũng được)…"
          className="input pl-10 pr-10 w-full"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500">
        {filtered.length} kết quả{query ? ` cho "${query}"` : ""} · {entries.length} thành viên trong lớp
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <section>
          <h2 className="font-bold text-navy-dark text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Quản trị lớp ({admins.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {admins.map((e) => (
              <DirectoryCard key={e.id} e={e} viewerIsAdmin={viewerIsAdmin} highlight />
            ))}
          </div>
        </section>
      )}

      {/* Lecturers */}
      {lecturers.length > 0 && (
        <section>
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-3">
            Giảng viên & biên tập ({lecturers.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lecturers.map((e) => (
              <DirectoryCard key={e.id} e={e} viewerIsAdmin={viewerIsAdmin} />
            ))}
          </div>
        </section>
      )}

      {/* Members (alphabetical jump list) */}
      {members.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
              Toàn lớp ({members.length})
            </h2>
            <div className="hidden md:flex flex-wrap gap-1 text-[11px]">
              {memberGroups.map(([letter]) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="w-6 h-6 rounded inline-flex items-center justify-center bg-slate-100 hover:bg-navy hover:text-white text-slate-600 font-semibold"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            {memberGroups.map(([letter, list]) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-24">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 sticky top-0 bg-slate-50/80 backdrop-blur-sm py-1 z-[1]">
                  {letter} · {list.length}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {list.map((e) => (
                    <DirectoryCard key={e.id} e={e} viewerIsAdmin={viewerIsAdmin} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="card p-10 text-center">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">Không tìm thấy</p>
          <p className="text-sm text-slate-500 mt-1">
            Thử tên ngắn hơn hoặc xoá bộ lọc.
          </p>
        </div>
      )}
    </div>
  );
}

function DirectoryCard({
  e,
  viewerIsAdmin,
  highlight,
  compact,
}: {
  e: DirectoryEntry;
  viewerIsAdmin: boolean;
  highlight?: boolean;
  compact?: boolean;
}) {
  const badge = ROLE_BADGE[e.role];
  const Icon = badge.Icon;
  const initial = givenName(e.name)[0] ?? "?";
  return (
    <div
      className={cn(
        "card flex items-center gap-3 transition-shadow",
        compact ? "p-2.5" : "p-4",
        highlight && "border-navy/30 bg-navy/5",
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center shrink-0 font-bold uppercase",
          highlight ? "bg-navy text-white" : "bg-navy/10 text-navy",
          compact ? "w-9 h-9 text-sm" : "w-11 h-11 text-base",
        )}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("font-semibold text-slate-800 truncate", compact ? "text-sm" : "text-[0.95rem]")}>
          {e.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {e.studentId && (
            <span className="text-[11px] text-slate-500 font-mono">{e.studentId}</span>
          )}
          {(highlight || e.role !== "STUDENT") && (
            <span className={cn("badge text-[10px]", badge.class)}>
              <Icon className="w-3 h-3" /> {badge.label}
            </span>
          )}
        </div>
        {viewerIsAdmin && e.email && !compact && (
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{e.email}</div>
        )}
      </div>
    </div>
  );
}
