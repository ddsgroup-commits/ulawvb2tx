"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, SimpleSelect } from "@/components/ui/simple-ui";
import {
  Plus,
  Trash2,
  Edit3,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Film,
  FileText,
  PlayCircle,
  BookOpen,
} from "lucide-react";

type LessonType = "VIDEO" | "READING" | "QUIZ" | "MIXED";
type LessonStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface LessonRow {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  type: LessonType;
  videoUrl?: string | null;
  attachments: string[];
  durationMin?: number | null;
  order: number;
  status: LessonStatus;
  createdAt: string;
}

interface CourseOpt {
  id: string;
  name: string;
}

const TYPE_OPTS = [
  { value: "VIDEO", label: "Video" },
  { value: "READING", label: "Đọc / tài liệu" },
  { value: "MIXED", label: "Hỗn hợp" },
  { value: "QUIZ", label: "Quiz (sắp ra)" },
];

const STATUS_OPTS = [
  { value: "PUBLISHED", label: "Đã xuất bản" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

const EMPTY_FORM = {
  courseId: "",
  title: "",
  description: "",
  type: "VIDEO" as LessonType,
  videoUrl: "",
  content: "",
  attachments: "",
  durationMin: "",
  status: "PUBLISHED" as LessonStatus,
};

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function loadAll() {
    setLoading(true);
    const [lRes, cRes] = await Promise.all([
      fetch(filterCourse ? `/api/lessons?courseId=${filterCourse}` : "/api/lessons"),
      fetch("/api/courses"),
    ]);
    const lJson = await lRes.json();
    const cJson = await cRes.json();
    if (lJson.ok) setLessons(lJson.data);
    if (cJson.ok)
      setCourses((cJson.data as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name })));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [filterCourse]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, courseId: filterCourse || courses[0]?.id || "" });
    setShowModal(true);
  }

  function openEdit(row: LessonRow) {
    setEditingId(row.id);
    setForm({
      courseId: row.courseId,
      title: row.title,
      description: row.description ?? "",
      type: row.type,
      videoUrl: row.videoUrl ?? "",
      content: row.content ?? "",
      attachments: row.attachments.join("\n"),
      durationMin: row.durationMin ? String(row.durationMin) : "",
      status: row.status,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId) {
      alert("Hãy chọn môn học");
      return;
    }
    setSaving(true);

    const payload = {
      courseId: form.courseId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      videoUrl: form.videoUrl.trim() || null,
      content: form.content.trim() || null,
      attachments: form.attachments
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      durationMin: form.durationMin ? Number(form.durationMin) : null,
      status: form.status,
    };

    const url = editingId ? `/api/lessons/${editingId}` : "/api/lessons";
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
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    loadAll();
  }

  async function handleDelete(row: LessonRow) {
    if (!confirm(`Xóa bài học "${row.title}"?\nTiến độ học của sinh viên cũng sẽ bị xóa theo.`)) return;
    const res = await fetch(`/api/lessons/${row.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) {
      alert(`Lỗi: ${json.error ?? "không xác định"}`);
      return;
    }
    loadAll();
  }

  async function reorder(row: LessonRow, dir: -1 | 1) {
    // Swap with adjacent lesson in same course.
    const sameCourse = lessons.filter((l) => l.courseId === row.courseId).sort((a, b) => a.order - b.order);
    const idx = sameCourse.findIndex((l) => l.id === row.id);
    const target = sameCourse[idx + dir];
    if (!target) return;
    await Promise.all([
      fetch(`/api/lessons/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/lessons/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: row.order }),
      }),
    ]);
    loadAll();
  }

  const grouped = useMemo(() => {
    const m = new Map<string, LessonRow[]>();
    for (const l of lessons) {
      const arr = m.get(l.courseId) ?? [];
      arr.push(l);
      m.set(l.courseId, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.order - b.order);
    return m;
  }, [lessons]);

  const courseFilterOpts = useMemo(
    () => [{ value: "", label: "— Tất cả môn —" }, ...courses.map((c) => ({ value: c.id, label: c.name }))],
    [courses],
  );

  const courseCreateOpts = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.name })),
    [courses],
  );

  function typeBadge(type: LessonType) {
    const map: Record<LessonType, { color: string; label: string; Icon: typeof Film }> = {
      VIDEO: { color: "bg-red-50 text-red-700", label: "Video", Icon: Film },
      READING: { color: "bg-blue-50 text-blue-700", label: "Đọc", Icon: FileText },
      MIXED: { color: "bg-purple-50 text-purple-700", label: "Hỗn hợp", Icon: PlayCircle },
      QUIZ: { color: "bg-amber-50 text-amber-700", label: "Quiz", Icon: BookOpen },
    };
    const { color, label, Icon } = map[type];
    return (
      <span className={`badge ${color} text-[10px]`}>
        <Icon className="w-3 h-3" /> {label}
      </span>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý bài học (LMS)</h1>
          <p className="text-slate-500 text-sm">
            {lessons.length} bài · {lessons.filter((l) => l.status === "PUBLISHED").length} đã xuất bản
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-56">
            <SimpleSelect
              value={filterCourse}
              options={courseFilterOpts}
              onChange={(e) => setFilterCourse(e.target.value)}
            />
          </div>
          <Button onClick={openCreate} size="sm" disabled={courses.length === 0}>
            <Plus className="w-4 h-4" /> Thêm bài học
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Đang tải…</div>
      ) : lessons.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Chưa có bài học nào</p>
          <p className="text-slate-400 text-sm mt-1">
            Thêm bài học đầu tiên cho lớp — sinh viên sẽ thấy ngay trong môn học tương ứng.
          </p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([courseId, list]) => {
          const courseName = courses.find((c) => c.id === courseId)?.name ?? "Môn không xác định";
          return (
            <div key={courseId} className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <h2 className="font-semibold text-navy text-sm">
                  {courseName} · {list.length} bài
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {list.map((row, i) => (
                  <div key={row.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => reorder(row, -1)}
                        disabled={i === 0}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorder(row, 1)}
                        disabled={i === list.length - 1}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-slate-400 w-6 text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeBadge(row.type)}
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
                        {row.durationMin && (
                          <span className="text-[10px] text-slate-500">{row.durationMin} phút</span>
                        )}
                      </div>
                      <div className="font-medium text-sm text-slate-800 mt-0.5">{row.title}</div>
                      {row.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">{row.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {row.videoUrl && (
                        <a
                          href={row.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-navy hover:bg-navy/10"
                          title="Mở video"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
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
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        title={editingId ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SimpleSelect
            label="Môn học"
            value={form.courseId}
            options={courseCreateOpts}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            required
            disabled={!!editingId}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tiêu đề bài học</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="VD: Buổi 1 — Khái niệm Nhà nước"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SimpleSelect
              label="Loại bài"
              value={form.type}
              options={TYPE_OPTS}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LessonType }))}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Thời lượng (phút)</label>
              <Input
                type="number"
                min="1"
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                placeholder="VD: 90"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">URL video (YouTube hoặc Drive)</label>
            <Input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>

          <div>
            <label className="label">Mô tả ngắn</label>
            <textarea
              className="input min-h-[60px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Tóm tắt 1-2 dòng về bài học"
            />
          </div>

          <div>
            <label className="label">Nội dung bài học (hỗ trợ xuống dòng)</label>
            <textarea
              className="input min-h-[140px]"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder={"Ghi chú giảng viên, mục tiêu, câu hỏi ôn tập…"}
            />
          </div>

          <div>
            <label className="label">Tài liệu đính kèm (mỗi URL một dòng)</label>
            <textarea
              className="input min-h-[60px]"
              value={form.attachments}
              onChange={(e) => setForm((f) => ({ ...f, attachments: e.target.value }))}
              placeholder={"https://drive.google.com/...\nhttps://drive.google.com/..."}
            />
          </div>

          <SimpleSelect
            label="Trạng thái"
            value={form.status}
            options={STATUS_OPTS}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LessonStatus }))}
          />

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
              {editingId ? "Lưu thay đổi" : "Thêm bài học"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
