"use client";

import { useState, useEffect } from "react";
import { Video, Plus, Trash2, Search, ExternalLink } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  url: string;
  type: string;
  status: string;
  duration: string | null;
  createdAt: string;
  course: { name: string } | null;
  uploader: { name: string | null; email: string } | null;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("YOUTUBE");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/videos?pageSize=50${q ? `&q=${q}` : ""}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setVideos(j.data.items); setLoading(false); });
  }

  useEffect(() => { load(); }, [q]);

  async function createVideo() {
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), url: url.trim(), type }),
    });
    setSaving(false);
    setShowNew(false);
    setTitle(""); setUrl(""); setType("YOUTUBE");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <Video className="w-5 h-5" /> Quản lý Video
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{videos.length} video</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Thêm video
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm video..." className="input pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton h-14 w-full" /></div>)}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Loại</th>
                  <th>Môn học</th>
                  <th>Người đăng</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {videos.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có video</td></tr>
                ) : videos.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div className="font-medium text-sm text-navy-dark">{v.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{v.url}</div>
                    </td>
                    <td><span className="badge-navy text-[10px]">{v.type}</span></td>
                    <td className="text-xs text-slate-500">{v.course?.name ?? "—"}</td>
                    <td className="text-xs text-slate-500">{v.uploader?.name ?? v.uploader?.email ?? "—"}</td>
                    <td>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        v.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" :
                        v.status === "DRAFT" ? "bg-slate-100 text-slate-500" :
                        "bg-amber-50 text-amber-700"
                      }`}>{v.status}</span>
                    </td>
                    <td>
                      <a href={v.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 inline-flex">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">Thêm video mới</h3>
              <button onClick={() => setShowNew(false)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="input-group">
                <label className="label">Tiêu đề *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Tiêu đề bài giảng..." />
              </div>
              <div className="input-group">
                <label className="label">Loại video</label>
                <select value={type} onChange={e => setType(e.target.value)} className="input">
                  <option value="YOUTUBE">YouTube</option>
                  <option value="GOOGLE_DRIVE">Google Drive</option>
                  <option value="EXTERNAL">Liên kết khác</option>
                </select>
              </div>
              <div className="input-group">
                <label className="label">URL *</label>
                <input value={url} onChange={e => setUrl(e.target.value)} className="input" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setShowNew(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={createVideo} disabled={saving || !title.trim() || !url.trim()} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? "Đang lưu..." : "Thêm video"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
