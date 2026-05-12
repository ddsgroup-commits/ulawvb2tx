"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { TagBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn, formatDateVi, TAG_LABELS } from "@/lib/utils";
import { Plus, Trash2, Pin, AlertTriangle, Clock } from "lucide-react";
import type { AnnouncementTag } from "@prisma/client";

const TAG_OPTIONS = Object.entries(TAG_LABELS).map(([v, l]) => ({ value: v, label: l }));

interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: AnnouncementTag;
  author: { name: string | null };
  pinned: boolean;
  urgent: boolean;
  published: boolean;
  publishAt: string | null;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", tag: "KHAC" as AnnouncementTag,
    pinned: false, urgent: false,
    publishAt: "",   // ISO datetime-local string (empty = publish now)
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/announcements?pageSize=50");
    const j = await res.json();
    if (j.ok) setItems(j.data.items);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : null,
      // If scheduled, mark published=false until publishAt is reached
      published: !form.publishAt,
    };
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", content: "", tag: "KHAC", pinned: false, urgent: false, publishAt: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa thông báo này?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePin(item: Announcement) {
    await fetch(`/api/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !item.pinned }),
    });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Thông báo</h1>
          <p className="text-slate-500 text-sm">{items.length} thông báo</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4" /> Thêm thông báo
        </Button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tag</th>
                <th>Tác giả</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có thông báo</td></tr>
              ) : (
                items.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="font-medium text-sm text-slate-800 max-w-xs truncate">{a.title}</div>
                    </td>
                    <td><TagBadge tag={a.tag} /></td>
                    <td className="text-xs text-slate-500">{a.author.name}</td>
                    <td className="text-xs text-slate-500">{formatDateVi(a.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        {a.pinned && (
                          <span className="badge bg-navy/10 text-navy text-[10px]">
                            <Pin className="w-3 h-3" />
                          </span>
                        )}
                        {a.urgent && (
                          <span className="badge bg-red-100 text-red-600 text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        {a.publishAt && !a.published && (
                          <span className="badge bg-amber-100 text-amber-600 text-[10px] flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(a.publishAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {!a.publishAt && !a.published && (
                          <span className="badge bg-slate-100 text-slate-500 text-[10px]">Ẩn</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => togglePin(a)}
                          title={a.pinned ? "Bỏ ghim" : "Ghim"}
                          className={cn("p-1.5 rounded-lg transition-colors",
                            a.pinned ? "text-navy hover:bg-navy/10" : "text-slate-400 hover:bg-slate-100")}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Thêm thông báo mới" size="lg">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Nhập tiêu đề thông báo..."
          />
          <Select
            label="Loại thông báo"
            value={form.tag}
            onChange={e => setForm(f => ({ ...f, tag: e.target.value as AnnouncementTag }))}
            options={TAG_OPTIONS}
          />
          <div>
            <label className="label">Nội dung</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
              placeholder="Nội dung chi tiết..."
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                className="rounded"
              />
              Ghim thông báo
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))}
                className="rounded"
              />
              Đánh dấu khẩn
            </label>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Lên lịch đăng bài (tuỳ chọn)
            </label>
            <input
              type="datetime-local"
              className="input text-sm"
              value={form.publishAt}
              onChange={e => setForm(f => ({ ...f, publishAt: e.target.value }))}
            />
            <p className="text-xs text-slate-400 mt-1">
              Để trống để đăng ngay. Chọn thời điểm để lên lịch tự động.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>Đăng thông báo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
