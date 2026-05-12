"use client";

import { useState, useEffect } from "react";
import { Megaphone, Search, Pin, ChevronDown, ChevronUp, Tag } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  publishAt: string;
}

const TAG_LABELS: Record<string, string> = {
  academic: "Học vụ", exam: "Thi cử", urgent: "Khẩn", event: "Sự kiện", general: "Chung", financial: "Học phí",
};

const TAG_COLORS: Record<string, string> = {
  academic: "bg-blue-100 text-blue-700", exam: "bg-red-100 text-red-700",
  urgent: "bg-orange-100 text-orange-700", event: "bg-purple-100 text-purple-700",
  general: "bg-slate-100 text-slate-600", financial: "bg-green-100 text-green-700",
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    fetch(`/api/announcements?${params}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setItems(j.data.items); setLoading(false); });
  }, [q, tag]);

  const pinned = items.filter(a => a.pinned);
  const regular = items.filter(a => !a.pinned);
  const allTags = [...new Set(items.flatMap(a => a.tags))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-ulaw" /> Thông báo
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">{items.length} thông báo</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm thông báo..."
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTag("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              tag === "" ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-slate-600 hover:border-navy"
            }`}>
            Tất cả
          </button>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? "" : t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                tag === t ? "bg-navy text-white border-navy" : `${TAG_COLORS[t] ?? "bg-slate-100"} border-transparent`
              }`}>
              {TAG_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="card p-5"><div className="skeleton h-14 w-full" /></div>)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <div className="section-title mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-ulaw" /> Đã ghim
              </div>
              <div className="space-y-2">
                {pinned.map(a => <AnnouncementItem key={a.id} item={a} expanded={expanded} setExpanded={setExpanded} />)}
              </div>
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && <div className="section-title mb-3">Thông báo khác</div>}
              <div className="space-y-2">
                {regular.map(a => <AnnouncementItem key={a.id} item={a} expanded={expanded} setExpanded={setExpanded} />)}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-text">Không có thông báo nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnnouncementItem({
  item, expanded, setExpanded
}: {
  item: Announcement;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  const isOpen = expanded === item.id;

  return (
    <div className={`card overflow-hidden ${item.pinned ? "border-l-4 border-l-ulaw" : ""}`}>
      <button
        onClick={() => setExpanded(isOpen ? null : item.id)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {item.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ulaw uppercase">
                <Pin className="w-2.5 h-2.5" /> Ghim
              </span>
            )}
            {item.tags.map(t => (
              <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[t] ?? "bg-slate-100 text-slate-600"}`}>
                {TAG_LABELS[t] ?? t}
              </span>
            ))}
            <span className="text-[10px] text-slate-400">
              {new Date(item.publishAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <div className="font-bold text-navy-dark text-sm leading-snug">{item.title}</div>
          {!isOpen && item.body && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && item.body && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{item.body}</div>
        </div>
      )}
    </div>
  );
}
