"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateVi } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  Pin,
  PinOff,
  Search,
  Youtube,
  HardDrive,
  Film,
} from "lucide-react";

interface VideoRow {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  courseId?: string | null;
  lecturer?: string | null;
  classDate?: string | null;
  url: string;
  embedUrl?: string | null;
  thumbnailUrl?: string | null;
  tags: string[];
  relatedDocs: string[];
  source: "YOUTUBE" | "DRIVE" | "OTHER";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  course?: { id: string; name: string } | null;
}

interface CourseOption { id: string; name: string }

const STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "Đã xuất bản" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

const EMPTY_FORM = {
  title: "",
  subject: "",
  courseId: "",
  lecturer: "",
  classDate: "",
  url: "",
  description: "",
  tags: "",
  relatedDocs: "",
  status: "PUBLISHED" as VideoRow["status"],
  pinned: false,
};

export default function AdminVideosPage() {
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const [vRes, cRes] = await Promise.all([
      fetch("/api/videos?take=200"),
      fetch("/api/courses"),
    ]);
    const vJson = await vRes.json();
    const cJson = await cRes.json();
    if (vJson.ok) setRows(vJson.data);
    if (cJson.ok) {
      setCourses(
        (cJson.data as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name })),
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(row: VideoRow) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      subject: row.subject ?? "",
      courseId: row.courseId ?? "",
      lecturer: row.lecturer ?? "",
      classDate: row.classDate ? row.classDate.slice(0, 10) : "",
      url: row.url,
      description: row.description ?? "",
      tags: row.tags.join(", "),
      relatedDocs: row.relatedDocs.join("\n"),
      status: row.status,
      pinned: row.pinned,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim() || null,
      courseId: form.courseId || null,
      lecturer: form.lecturer.trim() || null,
      classDate: form.classDate ? new Date(form.classDate).toISOString() : null,
      url: form.url.trim(),
      description: form.description.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      relatedDocs: form.relatedDocs
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
      pinned: form.pinned,
    };

    const url = editingId ? `/api/videos/${editingId}` : "/api/videos";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.ok) {
      alert(`Lỗi: ${json.error ?? "không xác định"}`);
      return;
    }
    setShowModal(false);
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    load();
  }

  async function handleDelete(row: VideoRow) {
    if (!confirm(`Xóa video "${row.title}"?`)) return;
    const res = await fetch(`/api/videos/${row.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) {
      alert(`Lỗi: ${json.error ?? "không xác định"}`);
      return;
    }
    load();
  }

  async function togglePin(row: VideoRow) {
    await fetch(`/api/videos/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !row.pinned }),
    });
    load();
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subject ?? "").toLowerCase().includes(q) ||
        (r.lecturer ?? "").toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const courseOptions = useMemo(
    () => [{ value: "", label: "— Không gắn môn —" }, ...courses.map((c) => ({ value: c.id, label: c.name }))],
    [courses],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Video bài giảng</h1>
          <p className="text-slate-500 text-sm">
            {rows.length} video · {rows.filter((r) => r.status === "PUBLISHED").length} đã xuất bản
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm video, môn, giảng viên, tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9 w-72"
            />
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4" /> Thêm video
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Môn / Giảng viên</th>
                <th>Ngày dạy</th>
                <th>Nguồn</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    Đang tải…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    {query ? "Không tìm thấy video" : "Chưa có video nào — thêm video đầu tiên"}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-start gap-3 min-w-[260px]">
                        <div className="w-20 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {row.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Film className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800 line-clamp-2">
                            {row.pinned && (
                              <Pin className="inline w-3.5 h-3.5 text-navy mr-1 -mt-0.5" />
                            )}
                            {row.title}
                          </div>
                          {row.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {row.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="badge bg-slate-100 text-slate-600 text-[10px]"
                                >
                                  {t}
                                </span>
                              ))}
                              {row.tags.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{row.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{row.course?.name ?? row.subject ?? "—"}</div>
                      <div className="text-xs text-slate-400">{row.lecturer ?? "—"}</div>
                    </td>
                    <td className="text-xs text-slate-500">
                      {row.classDate ? formatDateVi(row.classDate) : "—"}
                    </td>
                    <td>
                      {row.source === "YOUTUBE" ? (
                        <span className="badge bg-red-50 text-red-600 text-[10px]">
                          <Youtube className="w-3 h-3" /> YouTube
                        </span>
                      ) : row.source === "DRIVE" ? (
                        <span className="badge bg-emerald-50 text-emerald-700 text-[10px]">
                          <HardDrive className="w-3 h-3" /> Drive
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600 text-[10px]">Khác</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          row.status === "PUBLISHED"
                            ? "badge bg-green-50 text-green-700 text-[10px]"
                            : row.status === "DRAFT"
                              ? "badge bg-amber-50 text-amber-700 text-[10px]"
                              : "badge bg-slate-100 text-slate-500 text-[10px]"
                        }
                      >
                        {row.status === "PUBLISHED"
                          ? "Đã đăng"
                          : row.status === "DRAFT"
                            ? "Nháp"
                            : "Lưu trữ"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{row.viewCount}</td>
                    <td>
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => togglePin(row)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                          title={row.pinned ? "Bỏ ghim" : "Ghim"}
                        >
                          {row.pinned ? (
                            <PinOff className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-navy hover:bg-navy/10"
                          title="Mở video gốc"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        title={editingId ? "Chỉnh sửa video" : "Thêm video bài giảng"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="VD: Luật Dân sự — Buổi 5: Giao dịch dân sự"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Môn (text tự do)"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="VD: Luật Dân sự"
            />
            <Select
              label="Gắn vào môn học (tuỳ chọn)"
              value={form.courseId}
              options={courseOptions}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Giảng viên"
              value={form.lecturer}
              onChange={(e) => setForm((f) => ({ ...f, lecturer: e.target.value }))}
              placeholder="VD: ThS. Nguyễn Văn A"
            />
            <Input
              label="Ngày dạy"
              type="date"
              value={form.classDate}
              onChange={(e) => setForm((f) => ({ ...f, classDate: e.target.value }))}
            />
          </div>

          <Input
            label="URL video (YouTube hoặc Google Drive)"
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=… hoặc https://drive.google.com/file/d/…"
            required
          />

          <div>
            <label className="label">Mô tả</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Nội dung chính, chương đề cập, ghi chú dành cho sinh viên…"
            />
          </div>

          <Input
            label="Tags (ngăn cách bằng dấu phẩy)"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="bldc, thừa kế, ôn thi"
          />

          <div>
            <label className="label">Tài liệu liên quan (mỗi URL một dòng)</label>
            <textarea
              className="input min-h-[60px]"
              value={form.relatedDocs}
              onChange={(e) => setForm((f) => ({ ...f, relatedDocs: e.target.value }))}
              placeholder={"https://drive.google.com/...\nhttps://drive.google.com/..."}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <Select
              label="Trạng thái"
              value={form.status}
              options={STATUS_OPTIONS}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as VideoRow["status"] }))
              }
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 pb-2">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300"
              />
              Ghim lên đầu danh sách
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? "Lưu thay đổi" : "Thêm video"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
