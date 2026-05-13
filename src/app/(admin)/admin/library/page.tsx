"use client";

import { useState, useEffect } from "react";
import { Book, Plus, Edit2, Trash2, X, Search, FileText, ExternalLink } from "lucide-react";

interface LibraryItem {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  driveUrl: string | null;
  fileType: string | null;
  category: string;
  status: string;
  courseId: string | null;
  course: { name: string } | null;
  uploader: { name: string | null; email: string } | null;
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
}

const CATEGORY_MAP: Record<string, string> = {
  LEGAL_DOC: "Văn bản pháp luật",
  TEXTBOOK: "Giáo trình",
  SLIDE: "Slide bài giảng",
  TEACHER_NOTE: "Giáo án",
  STUDENT_NOTE: "Ghi chú SV",
  REFERENCE: "Tham khảo",
  PAST_EXAM: "Đề thi mẫu",
  ASSIGNMENT_TPL: "Mẫu bài tập",
  AI_SUMMARY: "Tóm tắt AI",
  ADMIN_DOC: "Văn bản HC",
};

export default function AdminLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    fileUrl: "",
    driveUrl: "",
    description: "",
    category: "TEXTBOOK",
    fileType: "PDF",
    courseId: "",
    status: "PUBLISHED"
  });

  function load() {
    setLoading(true);
    fetch("/api/admin/library")
      .then(r => r.json())
      .then(j => { if (j.ok) setItems(j.data); setLoading(false); });
  }

  function loadCourses() {
    fetch("/api/admin/courses")
      .then(r => r.json())
      .then(j => { if (j.ok) setCourses(j.data); });
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadCourses(); }, []);

  function openCreate() {
    setEditingItem(null);
    setFormData({
      title: "", fileUrl: "", driveUrl: "", description: "",
      category: "TEXTBOOK", fileType: "PDF", courseId: "",
      status: "PUBLISHED"
    });
    setShowModal(true);
  }

  function openEdit(item: LibraryItem) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      fileUrl: item.fileUrl || "",
      driveUrl: item.driveUrl || "",
      description: item.description || "",
      category: item.category,
      fileType: item.fileType || "PDF",
      courseId: item.courseId || "",
      status: item.status
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formData.title) return;
    setSaving(true);
    const method = editingItem ? "PATCH" : "POST";
    const url = editingItem ? `/api/admin/library/${editingItem.id}` : "/api/admin/library";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Xóa tài liệu này?")) return;
    await fetch(`/api/admin/library/${id}`, { method: "DELETE" });
    load();
  }

  const filteredItems = items.filter(i =>
    i.title.toLowerCase().includes(q.toLowerCase()) ||
    i.course?.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <Book className="w-5 h-5" /> Thư viện tài liệu
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{items.length} tài liệu trong hệ thống</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Thêm tài liệu
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm tài liệu..." className="input pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card p-5 h-16 w-full skeleton" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Danh mục</th>
                  <th>Môn học</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-navy-dark text-sm leading-snug">{item.title}</div>
                          <div className="text-[10px] text-slate-400">{item.fileType} · {new Date(item.createdAt).toLocaleDateString("vi-VN")}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag-default text-[10px]">{CATEGORY_MAP[item.category] || item.category}</span></td>
                    <td className="text-xs text-slate-500">{item.course?.name ?? "—"}</td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>{item.status === "PUBLISHED" ? "Đã đăng" : "Chờ duyệt"}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(item.fileUrl || item.driveUrl) && (
                          <a href={item.fileUrl || item.driveUrl || "#"} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600">
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
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">{editingItem ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="input-group">
                <label className="label">Tiêu đề tài liệu *</label>
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" placeholder="Giáo trình Luật Hiến pháp..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Danh mục</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input">
                    {Object.keys(CATEGORY_MAP).map(k => <option key={k} value={k}>{CATEGORY_MAP[k]}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Loại file</label>
                  <input value={formData.fileType} onChange={e => setFormData({ ...formData, fileType: e.target.value })} className="input" placeholder="PDF, DOCX, DRIVE..." />
                </div>
              </div>

              <div className="input-group">
                <label className="label">Môn học liên quan</label>
                <select value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })} className="input">
                  <option value="">Không có / Chung</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">File URL</label>
                  <input value={formData.fileUrl} onChange={e => setFormData({ ...formData, fileUrl: e.target.value })} className="input" placeholder="https://..." />
                </div>
                <div className="input-group">
                  <label className="label">Drive URL</label>
                  <input value={formData.driveUrl} onChange={e => setFormData({ ...formData, driveUrl: e.target.value })} className="input" placeholder="https://drive.google.com/..." />
                </div>
              </div>

              <div className="input-group">
                <label className="label">Mô tả thêm</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input min-h-[80px]" />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving ? "Đang lưu..." : editingItem ? "Cập nhật" : "Thêm tài liệu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
