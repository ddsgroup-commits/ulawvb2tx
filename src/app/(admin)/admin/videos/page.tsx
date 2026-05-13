"use client";

import { useState, useEffect } from "react";
import { Video as VideoIcon, Plus, Trash2, Edit2, Search, ExternalLink, X } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  url: string;
  type: string;
  status: string;
  duration: string | null;
  createdAt: string;
  courseId: string | null;
  course: { name: string } | null;
  uploader: { name: string | null; email: string } | null;
  description: string | null;
}

interface Course {
  id: string;
  name: string;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    type: "YOUTUBE",
    courseId: "",
    description: "",
    status: "PUBLISHED"
  });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/videos?pageSize=50${q ? `&q=${q}` : ""}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setVideos(j.data.items); setLoading(false); });
  }

  function loadCourses() {
    fetch("/api/admin/courses")
      .then(r => r.json())
      .then(j => { if (j.ok) setCourses(j.data); });
  }

  useEffect(() => { load(); }, [q]);
  useEffect(() => { loadCourses(); }, []);

  function openCreate() {
    setEditingVideo(null);
    setFormData({
      title: "", url: "", type: "YOUTUBE", courseId: "",
      description: "", status: "PUBLISHED"
    });
    setShowModal(true);
  }

  function openEdit(v: VideoItem) {
    setEditingVideo(v);
    setFormData({
      title: v.title,
      url: v.url,
      type: v.type,
      courseId: v.courseId || "",
      description: v.description || "",
      status: v.status
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formData.title || !formData.url) return;
    setSaving(true);
    const method = editingVideo ? "PATCH" : "POST";
    const url = editingVideo ? `/api/videos/${editingVideo.id}` : "/api/videos";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function deleteVideo(id: string) {
    if (!confirm("Xóa video này?")) return;
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <VideoIcon className="w-5 h-5" /> Quản lý Video
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{videos.length} video</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Thêm video
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm video..." className="input pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card p-5"><div className="skeleton h-14 w-full" /></div>)}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Loại</th>
                  <th>Môn học</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {videos.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">Chưa có video</td></tr>
                ) : videos.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div className="font-bold text-navy-dark text-sm leading-snug">{v.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">{v.url}</div>
                    </td>
                    <td><span className="badge-navy text-[10px]">{v.type}</span></td>
                    <td className="text-xs text-slate-500">{v.course?.name ?? "—"}</td>
                    <td>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        v.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" :
                        v.status === "DRAFT" ? "bg-slate-100 text-slate-500" :
                        "bg-amber-50 text-amber-700"
                      }`}>{v.status === "PUBLISHED" ? "Đã đăng" : "Nháp"}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={v.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteVideo(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
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
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">{editingVideo ? "Chỉnh sửa video" : "Thêm video mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="input-group">
                <label className="label">Tiêu đề *</label>
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input" placeholder="Tiêu đề bài giảng..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Loại video</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="input">
                    <option value="YOUTUBE">YouTube</option>
                    <option value="GOOGLE_DRIVE">Google Drive</option>
                    <option value="EXTERNAL">Liên kết khác</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Môn học</label>
                  <select value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })} className="input">
                    <option value="">Chọn môn học...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="label">URL *</label>
                <input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} className="input" placeholder="https://youtube.com/watch?v=..." />
              </div>

              <div className="input-group">
                <label className="label">Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input min-h-[80px]" />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={handleSubmit} disabled={saving || !formData.title || !formData.url} className="btn-primary flex-1">
                  {saving ? "Đang lưu..." : editingVideo ? "Cập nhật" : "Thêm video"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
