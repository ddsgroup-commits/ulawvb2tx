"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS, ROLE_LABELS, formatDateVi } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  CheckCircle, XCircle, MessageSquare, Eye, RefreshCw,
  ChevronLeft, ChevronRight, FileText, Film, Library, Megaphone,
} from "lucide-react";
import type { ContentStatus, Role } from "@prisma/client";

const STATUS_OPTIONS = [
  { value: "",          label: "Tất cả trạng thái" },
  { value: "SUBMITTED", label: "Chờ duyệt" },
  { value: "APPROVED",  label: "Đã duyệt" },
  { value: "REJECTED",  label: "Bị từ chối" },
  { value: "PUBLISHED", label: "Đã đăng" },
];

const TYPE_OPTIONS = [
  { value: "",            label: "Tất cả loại", icon: null },
  { value: "Announcement", label: "Thông báo",   icon: Megaphone },
  { value: "Video",       label: "Video",        icon: Film },
  { value: "LibraryItem", label: "Tài liệu",    icon: Library },
];

interface ApprovalItem {
  id: string;
  contentType: string;
  contentId: string;
  status: ContentStatus;
  submittedById: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  revisionNote: string | null;
  createdAt: string;
  submittedBy: { id: string; name: string | null; email: string; role: Role };
  reviewedBy:  { id: string; name: string | null } | null;
  content: Record<string, string> | null;
}

export default function AdminApprovalsPage() {
  const [items, setItems]     = useState<ApprovalItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("SUBMITTED");
  const [filterType, setFilterType]     = useState("");

  const [preview, setPreview]         = useState<ApprovalItem | null>(null);
  const [rejectModal, setRejectModal] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterType   ? { type:   filterType   } : {}),
    });
    const res = await fetch(`/api/approvals?${params}`);
    const j   = await res.json();
    if (j.ok) {
      setItems(j.data.items);
      setTotal(j.data.total);
      setTotalPages(j.data.totalPages);
    }
    setLoading(false);
  }, [page, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(
    approvalId: string,
    action: "approve" | "reject" | "request_revision",
    extra?: { rejectionReason?: string; revisionNote?: string }
  ) {
    setSaving(true);
    const res = await fetch(`/api/approvals/${approvalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const j = await res.json();
    setSaving(false);
    if (!j.ok) { alert(j.error); return; }
    setPreview(null);
    setRejectModal(null);
    setRejectReason("");
    setRevisionNote("");
    load();
  }

  async function handlePublish(approvalId: string) {
    setSaving(true);
    await fetch(`/api/approvals/${approvalId}`, { method: "PATCH" });
    setSaving(false);
    load();
  }

  function typeIcon(type: string) {
    if (type === "Video") return <Film className="w-3.5 h-3.5" />;
    if (type === "LibraryItem") return <Library className="w-3.5 h-3.5" />;
    return <Megaphone className="w-3.5 h-3.5" />;
  }

  function typeLabel(type: string) {
    if (type === "Video") return "Video";
    if (type === "LibraryItem") return "Tài liệu";
    return "Thông báo";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Duyệt Nội dung</h1>
          <p className="text-slate-500 text-sm">{total} mục</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input w-44"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="input w-40"
        >
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={load} className="btn btn-outline btn-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-slate-400">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            Không có nội dung nào
            {filterStatus === "SUBMITTED" && " đang chờ duyệt"}
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="card p-4 flex items-start gap-4">
            {/* Type icon */}
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              {typeIcon(item.contentType)}
            </div>

            {/* Content summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {typeLabel(item.contentType)}
                </span>
                <span className={cn("badge text-xs", CONTENT_STATUS_COLORS[item.status])}>
                  {CONTENT_STATUS_LABELS[item.status]}
                </span>
              </div>
              <div className="mt-1 font-semibold text-sm text-slate-800 truncate">
                {item.content?.title ?? `ID: ${item.contentId.slice(0, 8)}…`}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                {(item.content?.content as string | undefined)?.slice(0, 120) ?? item.content?.description ?? ""}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>
                  Gửi bởi: <strong className="text-slate-600">{item.submittedBy.name ?? item.submittedBy.email}</strong>
                  {" "}({ROLE_LABELS[item.submittedBy.role]})
                </span>
                <span>{formatDateVi(item.createdAt, "HH:mm dd/MM/yyyy")}</span>
              </div>
              {item.rejectionReason && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                  Lý do từ chối: {item.rejectionReason}
                </div>
              )}
              {item.revisionNote && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  Ghi chú sửa đổi: {item.revisionNote}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => setPreview(item)}
                className="btn btn-outline btn-sm text-xs"
              >
                <Eye className="w-3.5 h-3.5" /> Xem
              </button>
              {item.status === "SUBMITTED" && (
                <>
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={saving}
                    className="btn btn-sm text-xs bg-green-500 hover:bg-green-600 text-white"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => { setRejectModal(item); setRejectReason(""); setRevisionNote(""); }}
                    className="btn btn-sm text-xs bg-red-500 hover:bg-red-600 text-white"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                  <button
                    onClick={() => { setRejectModal(item); setRevisionNote(""); }}
                    className="btn btn-outline btn-sm text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Yêu cầu sửa
                  </button>
                </>
              )}
              {item.status === "APPROVED" && (
                <button
                  onClick={() => handlePublish(item.id)}
                  disabled={saving}
                  className="btn btn-sm text-xs bg-navy hover:bg-navy-dark text-white"
                >
                  <FileText className="w-3.5 h-3.5" /> Đăng
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Trang {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline btn-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <Modal open onClose={() => setPreview(null)} title={`Xem trước: ${preview.content?.title ?? "Nội dung"}`}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{typeLabel(preview.contentType)}</span>
              <span className={cn("badge text-xs", CONTENT_STATUS_COLORS[preview.status])}>
                {CONTENT_STATUS_LABELS[preview.status]}
              </span>
            </div>
            {preview.content && Object.entries(preview.content).map(([k, v]) =>
              k !== "id" && k !== "contentStatus" ? (
                <div key={k} className="text-sm">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{k}</div>
                  <div className="text-slate-700">{v}</div>
                </div>
              ) : null
            )}
            <div className="text-xs text-slate-400">
              Gửi bởi {preview.submittedBy.name ?? preview.submittedBy.email}
              {" · "}{formatDateVi(preview.createdAt, "HH:mm dd/MM/yyyy")}
            </div>
            {preview.status === "SUBMITTED" && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  onClick={() => handleAction(preview.id, "approve")}
                  loading={saving}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4" /> Duyệt
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => { setRejectModal(preview); setPreview(null); }}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4" /> Từ chối
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject / Revision modal */}
      {rejectModal && (
        <Modal
          open
          onClose={() => { setRejectModal(null); setRejectReason(""); setRevisionNote(""); }}
          title="Từ chối / Yêu cầu sửa đổi"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Nội dung: <strong>{rejectModal.content?.title ?? rejectModal.contentId}</strong>
            </p>
            <Input
              label="Lý do từ chối (để trống nếu chỉ yêu cầu sửa)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nội dung không phù hợp vì..."
            />
            <Input
              label="Ghi chú sửa đổi (tuỳ chọn)"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Vui lòng cập nhật..."
            />
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => { setRejectModal(null); }}>Hủy</Button>
              <Button
                variant="outline"
                loading={saving}
                onClick={() => handleAction(rejectModal.id, "request_revision", { revisionNote })}
              >
                <MessageSquare className="w-4 h-4" /> Yêu cầu sửa
              </Button>
              <Button
                variant="destructive"
                loading={saving}
                onClick={() => handleAction(rejectModal.id, "reject", { rejectionReason: rejectReason, revisionNote })}
              >
                <XCircle className="w-4 h-4" /> Từ chối
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
