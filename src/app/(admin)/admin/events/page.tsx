"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EventTypeBadge } from "@/components/ui/Badge";
import { formatDateVi, EVENT_TYPE_LABELS } from "@/lib/utils";
import { Plus, Trash2, Calendar, Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import type { EventType } from "@prisma/client";

const TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  time?: string | null;
  room?: string | null;
  onlineLink?: string | null;
  description?: string | null;
  reminderMinutes?: number | null;
  googleCalendarEventId?: string | null;
}

interface PushResult {
  pushed: number;
  connectedUsers: number;
  events: number;
  userErrors: Array<{ userId: string; error: string }>;
  message?: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: "",
    type: "CLASS" as EventType,
    time: "",
    room: "",
    onlineLink: "",
    description: "",
    reminderMinutes: "",
  });

  const now = new Date();

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
    const j = await res.json();
    if (j.ok) setEvents(j.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
        reminderMinutes: form.reminderMinutes ? Number(form.reminderMinutes) : undefined,
      }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", date: "", type: "CLASS", time: "", room: "", onlineLink: "", description: "", reminderMinutes: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa sự kiện này?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    load();
  }

  async function handlePushAll() {
    if (!confirm(`Đẩy tất cả sự kiện sắp tới lên Google Calendar của ${events.length > 0 ? "tất cả sinh viên đã kết nối" : "sinh viên"}?\n\nChỉ sinh viên đã kết nối Google Calendar mới nhận được.`)) return;
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const res = await fetch("/api/admin/calendar/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.ok) {
        setPushResult(json);
      } else {
        setPushError(json.error ?? "Lỗi không xác định");
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Lịch & Sự kiện</h1>
          <p className="text-slate-500 text-sm">{events.length} sự kiện tháng này</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePushAll}
            variant="outline"
            size="sm"
            disabled={pushing}
          >
            {pushing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Calendar className="w-4 h-4 text-blue-600" />
            }
            Đẩy lên Google Calendar
          </Button>
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus className="w-4 h-4" /> Thêm sự kiện
          </Button>
        </div>
      </div>

      {/* Push result banner */}
      {pushResult && (
        <div className="card p-4 border-l-4 border-green-500 bg-green-50 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 text-sm">
              Đã đẩy thành công {pushResult.pushed} sự kiện đến {pushResult.connectedUsers} sinh viên đã kết nối.
            </p>
            {pushResult.message && (
              <p className="text-green-700 text-xs mt-0.5">{pushResult.message}</p>
            )}
            {pushResult.userErrors.length > 0 && (
              <details className="mt-1">
                <summary className="text-xs text-amber-700 cursor-pointer">
                  {pushResult.userErrors.length} lỗi nhỏ (xem chi tiết)
                </summary>
                <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                  {pushResult.userErrors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e.error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <button onClick={() => setPushResult(null)} className="text-green-500 hover:text-green-700 text-lg leading-none">&times;</button>
        </div>
      )}
      {pushError && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-red-700 text-sm flex-1">{pushError}</p>
          <button onClick={() => setPushError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Admin note about Google Calendar */}
      <div className="card p-4 bg-blue-50 border border-blue-100 flex items-start gap-3">
        <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-1">
          <p className="font-semibold">Đồng bộ Google Calendar</p>
          <p>Nhấn <strong>Đẩy lên Google Calendar</strong> để gửi lịch học, thi và deadline sắp tới đến tất cả sinh viên đã kết nối tài khoản Google Calendar. Mỗi sinh viên phải tự kết nối một lần trong trang Lịch học.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Giờ</th>
                <th>Phòng / Link</th>
                <th>Google Cal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6 text-slate-400">Đang tải...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-slate-400">Không có sự kiện</td></tr>
              ) : events.map(e => (
                <tr key={e.id}>
                  <td><span className="font-medium text-sm text-slate-800">{e.title}</span></td>
                  <td className="text-xs text-slate-600">{formatDateVi(e.date)}</td>
                  <td><EventTypeBadge type={e.type} /></td>
                  <td className="text-xs text-slate-500">{e.time ?? "—"}</td>
                  <td className="text-xs text-slate-500 max-w-[140px] truncate">
                    {e.room ?? e.onlineLink ?? "—"}
                  </td>
                  <td>
                    {e.googleCalendarEventId ? (
                      <span className="badge bg-green-50 text-green-700 text-[10px]">Đã đẩy</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-400 text-[10px]">Chưa đẩy</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Thêm sự kiện" size="lg">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngày"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
            <Select
              label="Loại"
              value={form.type}
              options={TYPE_OPTIONS}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giờ (tuỳ chọn)"
              value={form.time}
              placeholder="07:30 – 11:30"
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
            <Input
              label="Phòng (tuỳ chọn)"
              value={form.room}
              placeholder="P.201"
              onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
            />
          </div>
          <Input
            label="Link online (Zoom / Meet)"
            value={form.onlineLink}
            placeholder="https://zoom.us/j/..."
            onChange={e => setForm(f => ({ ...f, onlineLink: e.target.value }))}
          />
          <div>
            <label className="label">Mô tả (tuỳ chọn)</label>
            <textarea
              className="input min-h-[64px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Nội dung buổi học, ghi chú thêm…"
            />
          </div>
          <Input
            label="Nhắc trước (phút, mặc định: 60)"
            type="number"
            value={form.reminderMinutes}
            placeholder="60"
            onChange={e => setForm(f => ({ ...f, reminderMinutes: e.target.value }))}
          />
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>Lưu sự kiện</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
