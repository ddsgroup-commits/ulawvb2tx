"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";

type ContentStatus = "DRAFT"|"SUBMITTED"|"UNDER_REVIEW"|"APPROVED"|"REJECTED"|"PUBLISHED"|"ARCHIVED";
type EntityType = "Announcement" | "Video" | "LibraryItem";

interface QueueItem {
  id: string;
  entity: EntityType;
  entityId: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  status: ContentStatus;
  courseId: string | null;
  courseName: string | null;
  note: string | null;
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Nháp", SUBMITTED: "Đã nộp", UNDER_REVIEW: "Đang xét duyệt",
  APPROVED: "Đã duyệt", REJECTED: "Từ chối", PUBLISHED: "Đã đăng", ARCHIVED: "Lưu trữ",
};

const ENTITY_LABELS: Record<EntityType, string> = {
  Announcement: "📢 Thông báo",
  Video: "🎬 Video",
  LibraryItem: "📂 Tài liệu",
};

export default function ModeratorPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentStatus | "ALL">("SUBMITTED");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [actionNote, setActionNote] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/moderation/queue?status=${activeTab === "ALL" ? "" : activeTab}`)
      .then(r => r.json())
      .then(j => {
        if (j.ok) setQueue(j.data);
        setLoading(false);
      });
  }, [activeTab]);

  async function handleAction(itemId: string, action: "approve" | "reject" | "request_revision") {
    setProcessing(itemId);
    await fetch(`/api/moderation/${itemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: actionNote }),
    });
    setProcessing(null);
    setSelectedItem(null);
    setActionNote("");
    // Reload
    fetch(`/api/moderation/queue?status=${activeTab === "ALL" ? "" : activeTab}`)
      .then(r => r.json())
      .then(j => j.ok && setQueue(j.data));
  }

  const TABS: { key: ContentStatus | "ALL"; label: string }[] = [
    { key: "SUBMITTED", label: "Chờ xét duyệt" },
    { key: "UNDER_REVIEW", label: "Đang xem xét" },
    { key: "APPROVED", label: "Đã duyệt" },
    { key: "REJECTED", label: "Từ chối" },
    { key: "ALL", label: "Tất cả" },
  ];

  const pendingCount = queue.filter(q => q.status === "SUBMITTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark">Hàng đợi xét duyệt nội dung</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Xem xét và phê duyệt nội dung từ Creator trước khi xuất bản
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="card p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-amber-800 text-sm font-medium">
            {pendingCount} nội dung đang chờ xét duyệt
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-navy text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-navy hover:text-navy"
            }`}>
            {t.label}
            {t.key === "SUBMITTED" && pendingCount > 0 && (
              <span className="ml-1.5 bg-ulaw text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="card p-5"><div className="skeleton h-16 w-full" /></div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p className="empty-state-text">Không có nội dung trong hàng đợi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(item => (
            <div key={item.id} className="queue-item">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-500">
                    {ENTITY_LABELS[item.entity]}
                  </span>
                  {item.courseName && (
                    <span className="badge-navy text-[10px]">{item.courseName}</span>
                  )}
                  <span className={`status-${item.status} text-[10px]`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div className="font-bold text-navy-dark text-sm">{item.title}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Gửi bởi: <span className="font-medium text-slate-600">{item.submittedBy}</span>
                  {" · "}{new Date(item.submittedAt).toLocaleString("vi-VN")}
                </div>
                {item.note && (
                  <div className="text-xs text-slate-500 mt-1.5 p-2 bg-slate-50 rounded-lg">
                    💬 {item.note}
                  </div>
                )}
              </div>

              {item.status === "SUBMITTED" || item.status === "UNDER_REVIEW" ? (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="btn-sm bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100">
                    <Eye className="w-3.5 h-3.5" /> Xem
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={processing === item.id}
                    className="btn-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                    <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "reject")}
                    disabled={processing === item.id}
                    className="btn-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </div>
              ) : (
                <div className="shrink-0">
                  <span className={`status-${item.status} text-[10px]`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="font-bold text-navy-dark">Xét duyệt nội dung</h3>
                <p className="text-xs text-slate-500 mt-0.5">{ENTITY_LABELS[selectedItem.entity]}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Tiêu đề</div>
                <div className="font-bold text-navy-dark">{selectedItem.title}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Gửi bởi</div>
                <div className="text-sm">{selectedItem.submittedBy}</div>
              </div>
              <div className="input-group">
                <label className="label">Ghi chú phản hồi (tuỳ chọn)</label>
                <textarea
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  className="input min-h-[80px] resize-y"
                  placeholder="Lý do duyệt/từ chối, yêu cầu chỉnh sửa..."
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setSelectedItem(null)} className="btn-outline flex-1">Hủy</button>
                <button
                  onClick={() => handleAction(selectedItem.id, "request_revision")}
                  disabled={processing === selectedItem.id}
                  className="btn flex-1 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100">
                  Yêu cầu sửa
                </button>
                <button
                  onClick={() => handleAction(selectedItem.id, "approve")}
                  disabled={processing === selectedItem.id}
                  className="btn flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                  ✓ Duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
