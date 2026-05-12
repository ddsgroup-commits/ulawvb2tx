"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn, formatDateVi } from "@/lib/utils";
import { Plus, Trash2, Download, ExternalLink, UploadCloud, X, FileText, Loader2 } from "lucide-react";
import type { LibraryCategory } from "@prisma/client";

const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  LEGAL_DOC: "Văn bản pháp luật",
  TEXTBOOK: "Giáo trình",
  PAST_EXAM: "Đề thi mẫu",
  LECTURE_NOTE: "Slide / Ghi chú",
  SYLLABUS: "Đề cương môn học",
  READING: "Tài liệu đọc bổ trợ",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip";

interface LibItem {
  id: string;
  title: string;
  category: LibraryCategory;
  description?: string | null;
  fileUrl?: string | null;
  driveId?: string | null;
  downloadCount: number;
  course?: { name: string } | null;
  createdAt: string;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export default function AdminLibraryPage() {
  const [items, setItems] = useState<LibItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "LEGAL_DOC" as LibraryCategory,
    description: "",
    fileUrl: "",
    driveId: "",
  });

  // Drive upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [driveLink, setDriveLink] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/library");
    const j = await res.json();
    if (j.ok) setItems(j.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetModal() {
    setForm({ title: "", category: "LEGAL_DOC", description: "", fileUrl: "", driveId: "" });
    setSelectedFile(null);
    setUploadState("idle");
    setUploadError("");
    setDriveLink("");
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadState("uploading");
    setUploadError("");
    setDriveLink("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/drive", { method: "POST", body: fd });
      const j = await res.json();

      if (!j.ok) {
        setUploadState("error");
        setUploadError(j.error ?? "Upload thất bại");
        return;
      }

      setUploadState("done");
      setDriveLink(j.data.webViewLink);
      setForm(f => ({
        ...f,
        driveId: j.data.fileId,
        // Auto-fill title from filename if empty
        title: f.title || file.name.replace(/\.[^.]+$/, ""),
      }));
    } catch {
      setUploadState("error");
      setUploadError("Không thể kết nối máy chủ");
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setUploadState("idle");
    setUploadError("");
    setDriveLink("");
    setForm(f => ({ ...f, driveId: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    resetModal();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa tài liệu này?")) return;
    await fetch(`/api/library/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Thư viện</h1>
          <p className="text-slate-500 text-sm">{items.length} tài liệu</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4" /> Thêm tài liệu
        </Button>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tên tài liệu</th>
                <th>Loại</th>
                <th>Mô tả</th>
                <th>Tải về</th>
                <th>Ngày thêm</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">Chưa có tài liệu</td></tr>
              ) : items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="font-medium text-sm text-slate-800 max-w-xs truncate">{item.title}</div>
                    {item.course && (
                      <div className="text-xs text-slate-400">{item.course.name}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-600 text-xs">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500 max-w-[180px] truncate">
                    {item.description ?? "—"}
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Download className="w-3 h-3" /> {item.downloadCount}
                    </span>
                  </td>
                  <td className="text-xs text-slate-400">{formatDateVi(item.createdAt)}</td>
                  <td>
                    <div className="flex gap-1.5 items-center">
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-navy hover:bg-navy/10 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {item.driveId && (
                        <a href={`https://drive.google.com/file/d/${item.driveId}/view`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Xem trên Google Drive">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetModal(); }}
        title="Thêm tài liệu mới"
        size="lg"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">

          {/* ── Drive Upload Zone ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Upload lên Google Drive
            </label>

            {uploadState === "idle" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-400 hover:border-navy/40 hover:text-navy/60 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-8 h-8" />
                <span className="text-sm font-medium">Chọn file để upload</span>
                <span className="text-xs">PDF, Word, Excel, PowerPoint, ảnh, ZIP — tối đa 50MB</span>
              </button>
            )}

            {uploadState === "uploading" && (
              <div className="w-full border border-slate-200 rounded-xl p-4 flex items-center gap-3 bg-slate-50">
                <Loader2 className="w-5 h-5 text-navy animate-spin shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-slate-400">Đang upload lên Google Drive...</p>
                </div>
              </div>
            )}

            {uploadState === "done" && (
              <div className="w-full border border-green-200 rounded-xl p-4 flex items-center gap-3 bg-green-50">
                <FileText className="w-5 h-5 text-green-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{selectedFile?.name}</p>
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 hover:underline"
                  >
                    Đã lưu trên Google Drive ↗
                  </a>
                </div>
                <button type="button" onClick={clearFile} className="p-1 rounded text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadState === "error" && (
              <div className="w-full border border-red-200 rounded-xl p-4 flex items-center gap-3 bg-red-50">
                <X className="w-5 h-5 text-red-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-red-700">Upload thất bại</p>
                  <p className="text-xs text-red-500">{uploadError}</p>
                </div>
                <button type="button" onClick={clearFile} className="text-xs text-slate-500 hover:text-slate-700 underline">
                  Thử lại
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="border-t border-slate-100 pt-1" />

          <Input
            label="Tên tài liệu"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <Select
            label="Loại tài liệu"
            value={form.category}
            options={CATEGORY_OPTIONS}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as LibraryCategory }))}
          />
          <Input
            label="Mô tả (tuỳ chọn)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Mô tả ngắn về tài liệu..."
          />
          <Input
            label="URL file (tuỳ chọn)"
            type="url"
            value={form.fileUrl}
            onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
            placeholder="https://..."
          />

          {/* Drive ID — auto-filled after upload, but still editable manually */}
          <Input
            label={`Google Drive File ID${uploadState === "done" ? " ✓ tự động điền" : " (tuỳ chọn)"}`}
            value={form.driveId}
            onChange={e => setForm(f => ({ ...f, driveId: e.target.value }))}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className={cn(uploadState === "done" && "border-green-300 bg-green-50")}
          />

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); resetModal(); }}>
              Hủy
            </Button>
            <Button type="submit" loading={saving} disabled={uploadState === "uploading"}>
              Lưu tài liệu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
