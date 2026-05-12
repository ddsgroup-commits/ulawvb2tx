"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Trash2, Pin, PinOff, Search } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  published: boolean;
  publishAt: string;
}

const TAG_OPTIONS = ["academic", "exam", "urgent", "event", "general", "financial"];
const TAG_LABELS: Record<string, string> = {
  academic: "Học vụ", exam: "Thi cử", urgent: "Khẩn", event: "Sự kiện", general: "Chung", financial: "Học phí",
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [q, setQ] = useState("");

  // New form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/announcements?pageSize=50${q ? `&q=${q}` : ""}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setItems(j.data.items); setLoading(false); });
  }

  useEffect(() => { load(); }, [q]);

  async function createAnnouncement() {
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body, tags, pinned, publishAt: publishAt || undefined }),
    });
    setSaving(false);
    setShowNew(false);
    setTitle(""); setBody(""); setTags([]); setPinned(false); setPublishAt("");
    load();
  }

  async function togglePin(id: string, current: boolean) {
    await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !current }),
    });
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Xóa thông báo này?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    load();
  }

  function toggleTag(t: string) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Quản lý thông báo
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{items.length} thông báo</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Tạo thông báo
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm kiếm..." className="input pl-9" />
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
                  <th>Tags</th>
                  <th>Ngày đăng</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">Chưa có thông báo</td></tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {item.pinned && <Pin className="w-3.5 h-3.5 text-ulaw shrink-0" />}
                        <span className="font-medium text-sm text-navy-dark">{item.title}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.map(t => (
                          <span key={t} className="tag-default text-[10px]">{TAG_LABELS[t] ?? t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(item.publishAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.published ? "Đã đăng" : "Nháp"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => togglePin(item.id, item.pinned)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                          title={item.pinned ? "Bỏ ghim" : "Ghim"}>
                          {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
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

      {/* New announcement modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">Tạo thông báo mới</h3>
              <button onClick={() => setShowNew(false)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="input-group">
                <label className="label">Tiêu đề *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Tiêu đề thông báo..." />
              </div>
              <div className="input-group">
                <label className="label">Nội dung</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} className="input min-h-[120px] resize-y" placeholder="Nội dung chi tiết..." />
              </div>
              <div className="input-group">
                <label className="label">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(t => (
                    <button key={t} onClick={() => toggleTag(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        tags.includes(t) ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-slate-600"
                      }`}>
                      {TAG_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Thời gian đăng (tuỳ chọn)</label>
                  <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)} className="input" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded" />
                    <span className="text-sm font-medium text-slate-700">Ghim thông báo</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setShowNew(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={createAnnouncement} disabled={saving || !title.trim()} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? "Đang lưu..." : "Tạo thông báo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
