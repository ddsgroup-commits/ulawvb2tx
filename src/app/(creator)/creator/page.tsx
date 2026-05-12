"use client";

import { useState, useEffect } from "react";
import { Plus, Send, Edit3, FileText, Video, Megaphone, Clock } from "lucide-react";

type ContentStatus = "DRAFT"|"SUBMITTED"|"UNDER_REVIEW"|"APPROVED"|"REJECTED"|"PUBLISHED"|"ARCHIVED";
type EntityType = "announcement" | "video" | "library";

interface Draft {
  id: string;
  type: EntityType;
  title: string;
  status: ContentStatus;
  courseName: string | null;
  createdAt: string;
  updatedAt: string;
  note: string | null;
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Nháp", SUBMITTED: "Đã nộp duyệt", UNDER_REVIEW: "Đang xét duyệt",
  APPROVED: "Đã duyệt", REJECTED: "Từ chối – cần sửa", PUBLISHED: "Đã xuất bản", ARCHIVED: "Lưu trữ",
};

const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  announcement: <Megaphone className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  library: <FileText className="w-4 h-4" />,
};

const TYPE_LABELS: Record<EntityType, string> = {
  announcement: "Thông báo",
  video: "Video",
  library: "Tài liệu",
};

export default function CreatorPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState<EntityType>("announcement");

  useEffect(() => {
    fetch("/api/creator/drafts")
      .then(r => r.json())
      .then(j => {
        if (j.ok) setDrafts(j.data);
        setLoading(false);
      });
  }, []);

  async function submitForReview(draftId: string) {
    setSubmitting(draftId);
    await fetch(`/api/creator/drafts/${draftId}/submit`, { method: "POST" });
    setSubmitting(null);
    fetch("/api/creator/drafts")
      .then(r => r.json())
      .then(j => j.ok && setDrafts(j.data));
  }

  const stats = {
    total: drafts.length,
    drafts: drafts.filter(d => d.status === "DRAFT").length,
    pending: drafts.filter(d => ["SUBMITTED","UNDER_REVIEW"].includes(d.status)).length,
    published: drafts.filter(d => d.status === "PUBLISHED").length,
    rejected: drafts.filter(d => d.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-hero-red">
        <h1 className="text-2xl font-extrabold text-white mb-1">🎨 Creator Studio</h1>
        <p className="text-white/70 text-sm">Tạo nội dung · Nộp duyệt · Theo dõi trạng thái</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng bản nháp", value: stats.total, color: "text-slate-700" },
          { label: "Chờ duyệt", value: stats.pending, color: "text-amber-600" },
          { label: "Đã xuất bản", value: stats.published, color: "text-emerald-600" },
          { label: "Cần sửa", value: stats.rejected, color: "text-ulaw" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-value ${s.color}`}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New content buttons */}
      <div>
        <div className="section-title mb-3">Tạo nội dung mới</div>
        <div className="flex flex-wrap gap-3">
          {(["announcement", "video", "library"] as EntityType[]).map(type => (
            <button key={type}
              onClick={() => { setNewType(type); setShowNew(true); }}
              className="btn-outline flex items-center gap-2">
              {TYPE_ICONS[type]}
              Tạo {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Drafts list */}
      <div>
        <div className="section-title mb-3">Bản nháp của tôi</div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="card p-5"><div className="skeleton h-14 w-full" /></div>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✏️</div>
            <p className="empty-state-text">Chưa có bản nháp nào. Bắt đầu tạo nội dung!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map(d => (
              <div key={d.id} className="card p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  d.type === "announcement" ? "bg-navy/10 text-navy" :
                  d.type === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {TYPE_ICONS[d.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {TYPE_LABELS[d.type]}
                    </span>
                    {d.courseName && <span className="badge-navy text-[10px]">{d.courseName}</span>}
                    <span className={`status-${d.status} text-[10px]`}>{STATUS_LABELS[d.status]}</span>
                  </div>
                  <div className="font-bold text-navy-dark text-sm">{d.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    <Clock className="inline w-3 h-3 mr-0.5" />
                    Cập nhật: {new Date(d.updatedAt).toLocaleString("vi-VN", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
                  </div>
                  {d.note && d.status === "REJECTED" && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs text-red-700">💬 <span className="font-semibold">Lý do từ chối:</span> {d.note}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button className="btn-outline btn-sm">
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  {(d.status === "DRAFT" || d.status === "REJECTED") && (
                    <button
                      onClick={() => submitForReview(d.id)}
                      disabled={submitting === d.id}
                      className="btn-primary btn-sm">
                      <Send className="w-3.5 h-3.5" />
                      {submitting === d.id ? "..." : "Nộp duyệt"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Content Modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">Tạo {TYPE_LABELS[newType]} mới</h3>
              <button onClick={() => setShowNew(false)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2 mb-2">
                {(["announcement","video","library"] as EntityType[]).map(t => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`btn-sm flex items-center gap-1.5 ${newType === t ? "btn-primary" : "btn-outline"}`}>
                    {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="input-group">
                <label className="label">Tiêu đề</label>
                <input type="text" className="input" placeholder={`Tiêu đề ${TYPE_LABELS[newType]}...`} />
              </div>
              {newType !== "video" && (
                <div className="input-group">
                  <label className="label">Nội dung</label>
                  <textarea className="input min-h-[120px] resize-y" placeholder="Nội dung chi tiết..." />
                </div>
              )}
              {newType === "video" && (
                <div className="input-group">
                  <label className="label">Link video</label>
                  <input type="url" className="input" placeholder="https://youtube.com/..." />
                </div>
              )}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                ⚠️ Nội dung sau khi tạo sẽ ở trạng thái <strong>Nháp</strong>. Bạn cần nộp duyệt để Moderator xét duyệt trước khi xuất bản.
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setShowNew(false)} className="btn-outline flex-1">Hủy</button>
                <button className="btn-primary flex-1">Lưu bản nháp</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
