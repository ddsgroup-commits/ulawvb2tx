"use client";

import { useState, useEffect } from "react";
import { cn, CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS, formatDateVi } from "@/lib/utils";
import { Send, Trash2, Film, FileText, Megaphone } from "lucide-react";
import type { ContentStatus } from "@prisma/client";

interface DraftItem {
  id: string;
  title: string;
  contentStatus: ContentStatus;
  createdAt: string;
  _type: "Announcement" | "Video" | "LibraryItem";
}

export default function CreatorDraftsPage() {
  const [items, setItems]     = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [ann, vid, lib] = await Promise.all([
      fetch("/api/announcements?contentStatus=DRAFT,REJECTED,SUBMITTED&mine=1&pageSize=50").then((r) => r.json()),
      fetch("/api/videos?contentStatus=DRAFT,REJECTED,SUBMITTED&mine=1&pageSize=50").then((r) => r.json()),
      fetch("/api/library?contentStatus=DRAFT,REJECTED,SUBMITTED&mine=1&pageSize=50").then((r) => r.json()),
    ]);

    const mapped: DraftItem[] = [
      ...(ann.ok ? ann.data.items.map((i: DraftItem) => ({ ...i, _type: "Announcement" as const })) : []),
      ...(vid.ok ? vid.data.items.map((i: DraftItem) => ({ ...i, _type: "Video" as const })) : []),
      ...(lib.ok ? lib.data.items.map((i: DraftItem) => ({ ...i, _type: "LibraryItem" as const })) : []),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setItems(mapped);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submitForReview(item: DraftItem) {
    setSubmitting(item.id);
    const res = await fetch("/api/content/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: item._type, contentId: item.id }),
    });
    const j = await res.json();
    setSubmitting(null);
    if (!j.ok) { alert(j.error); return; }
    load();
  }

  function typeIcon(type: string) {
    if (type === "Video")       return <Film      className="w-4 h-4" />;
    if (type === "LibraryItem") return <FileText  className="w-4 h-4" />;
    return                              <Megaphone className="w-4 h-4" />;
  }

  function typeLabel(type: string) {
    if (type === "Video")       return "Video";
    if (type === "LibraryItem") return "Tài liệu";
    return "Thông báo";
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark">Nháp của tôi</h1>
        <p className="text-slate-500 text-sm">{items.length} mục</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">
          Bạn chưa có nháp nào. Hãy tạo nội dung mới từ sidebar.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item._type}-${item.id}`} className="card p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                {typeIcon(item._type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{typeLabel(item._type)}</span>
                  <span className={cn("badge text-xs", CONTENT_STATUS_COLORS[item.contentStatus])}>
                    {CONTENT_STATUS_LABELS[item.contentStatus]}
                  </span>
                </div>
                <div className="font-medium text-sm text-slate-800 mt-0.5 truncate">{item.title}</div>
                <div className="text-xs text-slate-400">{formatDateVi(item.createdAt)}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                {["DRAFT", "REJECTED"].includes(item.contentStatus) && (
                  <button
                    onClick={() => submitForReview(item)}
                    disabled={submitting === item.id}
                    className="btn btn-sm text-xs bg-navy hover:bg-navy-dark text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting === item.id ? "Đang gửi..." : "Gửi duyệt"}
                  </button>
                )}
                {item.contentStatus === "SUBMITTED" && (
                  <span className="text-xs text-amber-600 self-center">Đang chờ duyệt</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
