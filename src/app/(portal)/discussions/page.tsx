"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, ChevronRight, Pin } from "lucide-react";

interface Discussion {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: { name: string | null; role: string };
  course: { name: string; slug: string } | null;
  _count: { replies: number };
}

export default function DiscussionsPage() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/discussions?pageSize=50")
      .then(r => r.json())
      .then(j => { if (j.ok) { setItems(j.data.items); setTotal(j.data.total); } setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function createDiscussion() {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim() }),
    });
    setSubmitting(false);
    setShowNew(false);
    setNewTitle("");
    setNewBody("");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-ulaw" /> Thảo luận
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} chủ đề · Hỏi đáp và trao đổi học tập</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Tạo chủ đề
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton h-16 w-full" /></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <p className="empty-state-text">Chưa có chủ đề thảo luận nào</p>
          <button onClick={() => setShowNew(true)} className="btn-primary btn-sm mt-3">
            <Plus className="w-3.5 h-3.5" /> Tạo chủ đề đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`card p-4 hover:shadow-card-hover transition-shadow ${item.isPinned ? "border-l-4 border-l-navy" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {item.isPinned && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-navy uppercase">
                        <Pin className="w-2.5 h-2.5" /> Ghim
                      </span>
                    )}
                    {item.isResolved && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Đã giải quyết</span>
                    )}
                    {item.course && (
                      <span className="badge-navy text-[10px]">{item.course.name}</span>
                    )}
                  </div>
                  <div className="font-bold text-navy-dark text-sm">{item.title}</div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.body}</p>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-3">
                    <span>{item.author.name ?? "Ẩn danh"}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {item._count.replies} trả lời
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New discussion modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">Tạo chủ đề thảo luận</h3>
              <button onClick={() => setShowNew(false)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="input-group">
                <label className="label">Tiêu đề</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="input"
                  placeholder="Đặt tiêu đề cho câu hỏi..."
                />
              </div>
              <div className="input-group">
                <label className="label">Nội dung</label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  className="input min-h-[120px] resize-y"
                  placeholder="Mô tả chi tiết câu hỏi hoặc vấn đề..."
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setShowNew(false)} className="btn-outline flex-1">Hủy</button>
                <button
                  onClick={createDiscussion}
                  disabled={submitting || !newTitle.trim() || !newBody.trim()}
                  className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? "Đang tạo..." : "Tạo chủ đề"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
