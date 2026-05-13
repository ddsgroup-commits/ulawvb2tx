"use client";

import { useState, useEffect } from "react";
import { BookOpen, ExternalLink, Plus, Edit2, Trash2, X, Save } from "lucide-react";

interface Course {
  id: string;
  name: string;
  slug: string;
  code: string;
  credits: number;
  status: string;
  icon: string | null;
  lecturerId: string | null;
  lecturer: { name: string | null } | null;
  notebooklmUrl: string | null;
  driveUrl: string | null;
  description: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Sắp khai giảng", ACTIVE: "Đang học", COMPLETED: "Đã hoàn thành",
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-amber-50 text-amber-700", ACTIVE: "bg-emerald-50 text-emerald-700", COMPLETED: "bg-slate-100 text-slate-600",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: "3",
    status: "UPCOMING",
    icon: "📚",
    description: "",
    notebooklmUrl: "",
    driveUrl: "",
    lecturerId: ""
  });

  function load() {
    setLoading(true);
    fetch("/api/admin/courses")
      .then(r => r.json())
      .then(j => { if (j.ok) setCourses(j.data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingCourse(null);
    setFormData({
      name: "", code: "", credits: "3", status: "UPCOMING",
      icon: "📚", description: "",
      notebooklmUrl: "", driveUrl: "", lecturerId: ""
    });
    setShowModal(true);
  }

  function openEdit(c: Course) {
    setEditingCourse(c);
    setFormData({
      name: c.name,
      code: c.code,
      credits: String(c.credits),
      status: c.status,
      icon: c.icon || "📚",
      description: c.description || "",
      notebooklmUrl: c.notebooklmUrl || "",
      driveUrl: c.driveUrl || "",
      lecturerId: c.lecturerId || ""
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formData.name || !formData.code) return;
    setSaving(true);
    const method = editingCourse ? "PATCH" : "POST";
    const url = editingCourse ? `/api/admin/courses/${editingCourse.id}` : "/api/admin/courses";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function deleteCourse(id: string) {
    if (!confirm("Xóa môn học này sẽ xóa toàn bộ bài giảng và tài liệu liên quan. Bạn chắc chắn?")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Quản lý môn học
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{courses.length} môn học</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Thêm môn học
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card p-5"><div className="skeleton h-24 w-full" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id} className="card p-5 hover:shadow-card-hover transition-shadow group relative">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => openEdit(course)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-navy">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteCourse(course.id)} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-navy/10 text-navy">
                  {course.icon ?? "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-dark text-sm leading-snug">{course.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{course.code} · {course.credits} tín chỉ</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[course.status] ?? ""}`}>
                  {STATUS_LABELS[course.status] ?? course.status}
                </span>
                <span className="text-[11px] text-slate-400">{course.lecturer?.name ?? "—"}</span>
              </div>

              <div className="flex gap-2">
                {course.notebooklmUrl && (
                  <a href={course.notebooklmUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 btn-sm bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-[11px]">
                    🔮 NotebookLM
                  </a>
                )}
                {course.driveUrl && (
                  <a href={course.driveUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 btn-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[11px]">
                    <ExternalLink className="w-3 h-3" /> Drive
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">{editingCourse ? "Chỉnh sửa môn học" : "Thêm môn học mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Tên môn học *</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="Luật Hiến pháp..." />
                </div>
                <div className="input-group">
                  <label className="label">Mã học phần *</label>
                  <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="input" placeholder="LHP-VB2..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="input-group">
                  <label className="label">Số tín chỉ</label>
                  <input type="number" value={formData.credits} onChange={e => setFormData({ ...formData, credits: e.target.value })} className="input" />
                </div>
                <div className="input-group">
                  <label className="label">Trạng thái</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="input">
                    <option value="UPCOMING">Sắp khai giảng</option>
                    <option value="ACTIVE">Đang học</option>
                    <option value="COMPLETED">Đã hoàn thành</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Icon</label>
                  <input value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="input" placeholder="⚖️" />
                </div>
              </div>

              <div className="input-group">
                <label className="label">Mô tả ngắn</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input min-h-[80px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">NotebookLM URL</label>
                  <input value={formData.notebooklmUrl} onChange={e => setFormData({ ...formData, notebooklmUrl: e.target.value })} className="input" />
                </div>
                <div className="input-group">
                  <label className="label">Drive Folder URL</label>
                  <input value={formData.driveUrl} onChange={e => setFormData({ ...formData, driveUrl: e.target.value })} className="input" />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving ? "Đang lưu..." : editingCourse ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
