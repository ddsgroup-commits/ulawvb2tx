"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchInput } from "@/components/ui/Input";
import { TagBadge } from "@/components/ui/Badge";
import { cn, formatDateVi, TAG_LABELS } from "@/lib/utils";
import { ChevronDown, ChevronUp, Pin, AlertTriangle } from "lucide-react";
import type { AnnouncementTag } from "@prisma/client";

const TAGS: { value: AnnouncementTag | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "LICH_HOC", label: TAG_LABELS.LICH_HOC },
  { value: "DEADLINE", label: TAG_LABELS.DEADLINE },
  { value: "THAY_DOI", label: TAG_LABELS.THAY_DOI },
  { value: "THI_CU", label: TAG_LABELS.THI_CU },
  { value: "CHUNG_CHI", label: TAG_LABELS.CHUNG_CHI },
  { value: "KHAC", label: TAG_LABELS.KHAC },
];

interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: AnnouncementTag;
  author: { name: string | null };
  pinned: boolean;
  urgent: boolean;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [tag, setTag] = useState<AnnouncementTag | "">("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "30" });
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    const res = await fetch(`/api/announcements?${params}`);
    const json = await res.json();
    if (json.ok) setItems(json.data.items);
    setLoading(false);
  }, [tag, q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const pinned = items.filter(a => a.pinned);
  const rest = items.filter(a => !a.pinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Thông báo lớp</h1>
        <p className="text-slate-500 text-sm mt-1">Tất cả thông báo, lịch học và deadline của lớp</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput
          placeholder="Tìm thông báo..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTag(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                tag === t.value
                  ? "bg-navy text-white border-navy"
                  : "border-slate-200 text-slate-600 hover:border-navy hover:text-navy bg-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <Pin className="w-3.5 h-3.5" /> Ghim
          </div>
          {pinned.map(a => (
            <AnnouncementItem
              key={a.id}
              item={a}
              expanded={expanded === a.id}
              onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
            />
          ))}
        </div>
      )}

      {/* All */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))
        ) : rest.length === 0 && pinned.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p>Không tìm thấy thông báo nào</p>
          </div>
        ) : (
          rest.map(a => (
            <AnnouncementItem
              key={a.id}
              item={a}
              expanded={expanded === a.id}
              onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AnnouncementItem({
  item,
  expanded,
  onToggle,
}: {
  item: Announcement;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "card overflow-hidden transition-all",
        item.urgent && "border-l-4 border-l-red-400",
        item.pinned && "border-l-4 border-l-navy"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <TagBadge tag={item.tag} />
            {item.urgent && (
              <span className="badge bg-red-100 text-red-600 text-[10px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Khẩn
              </span>
            )}
            {item.pinned && (
              <span className="badge bg-navy/10 text-navy text-[10px] flex items-center gap-1">
                <Pin className="w-3 h-3" /> Ghim
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-800">{item.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {item.author.name} · {formatDateVi(item.createdAt)}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="prose prose-sm max-w-none text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">
            {item.content}
          </div>
        </div>
      )}
    </div>
  );
}
