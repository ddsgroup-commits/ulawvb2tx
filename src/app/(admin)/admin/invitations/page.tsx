"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Mail, Copy, Check, Clock, UserCheck, AlertCircle } from "lucide-react";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS = [
  { value: "ADMIN",     label: "Quản trị viên (ADMIN)" },
  { value: "MODERATOR", label: "Kiểm duyệt viên (MODERATOR)" },
  { value: "CREATOR",   label: "Người tạo nội dung (CREATOR)" },
  { value: "STUDENT",   label: "Sinh viên (STUDENT)" },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN:     "bg-red-100 text-red-700",
  MODERATOR: "bg-purple-100 text-purple-700",
  CREATOR:   "bg-blue-100 text-blue-700",
  STUDENT:   "bg-green-100 text-green-700",
};

interface Invitation {
  id:          string;
  email:       string;
  role:        Role;
  token:       string;
  expiresAt:   string;
  usedAt:      string | null;
  note:        string | null;
  createdAt:   string;
  inviter:     { name: string | null; email: string };
}

function statusOf(inv: Invitation) {
  if (inv.usedAt)                       return "used";
  if (new Date(inv.expiresAt) < new Date()) return "expired";
  return "pending";
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const [form, setForm] = useState({
    email:     "",
    role:      "CREATOR" as string,
    note:      "",
    expiresIn: "7",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invitations");
    const j   = await res.json();
    if (j.ok) setInvitations(j.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresIn: Number(form.expiresIn) }),
    });
    const j = await res.json();
    setSaving(false);
    if (!j.ok) {
      setError(typeof j.error === "string" ? j.error : "Có lỗi xảy ra");
      return;
    }
    setShowModal(false);
    setForm({ email: "", role: "CREATOR", note: "", expiresIn: "7" });
    load();
  }

  async function handleRevoke(id: string) {
    if (!confirm("Hủy lời mời này?")) return;
    await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    load();
  }

  async function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const pending  = invitations.filter(i => statusOf(i) === "pending");
  const used     = invitations.filter(i => statusOf(i) === "used");
  const expired  = invitations.filter(i => statusOf(i) === "expired");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Lời mời Admin</h1>
          <p className="text-slate-500 text-sm">
            {pending.length} đang chờ · {used.length} đã dùng · {expired.length} hết hạn
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4" /> Gửi lời mời
        </Button>
      </div>

      {/* Pending invitations */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-navy-dark text-sm">Đang chờ xác nhận ({pending.length})</h3>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Đang tải...</div>
        ) : pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Không có lời mời nào đang chờ</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map(inv => (
              <div key={inv.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800">{inv.email}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("badge text-[10px] px-1.5 py-0.5", ROLE_COLORS[inv.role])}>
                      {inv.role}
                    </span>
                    <span className="text-xs text-slate-400">
                      Hết hạn: {new Date(inv.expiresAt).toLocaleDateString("vi-VN")}
                    </span>
                    {inv.note && (
                      <span className="text-xs text-slate-400 italic truncate max-w-[160px]">
                        "{inv.note}"
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400 hidden sm:block">
                  Bởi: {inv.inviter.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyLink(inv.token, inv.id)}
                    title="Sao chép link mời"
                    className="p-1.5 rounded-lg text-navy hover:bg-navy/10 transition-colors"
                  >
                    {copiedId === inv.id
                      ? <Check className="w-4 h-4 text-green-600" />
                      : <Copy className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    title="Hủy lời mời"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used invitations */}
      {used.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-navy-dark text-sm">Đã kích hoạt ({used.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {used.map(inv => (
              <div key={inv.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-700">{inv.email}</div>
                  <div className="text-xs text-slate-400">
                    Kích hoạt: {new Date(inv.usedAt!).toLocaleString("vi-VN")}
                  </div>
                </div>
                <span className={cn("badge text-[10px]", ROLE_COLORS[inv.role])}>{inv.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired invitations */}
      {expired.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-navy-dark text-sm">Hết hạn ({expired.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {expired.map(inv => (
              <div key={inv.id} className="px-5 py-3 flex items-center gap-3 opacity-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-600">{inv.email}</div>
                  <div className="text-xs text-slate-400">
                    Hết hạn: {new Date(inv.expiresAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Invitation Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setError(null); }}
        title="Gửi lời mời tham gia"
        size="lg"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="notice notice-danger text-sm">{error}</div>
          )}
          <Input
            label="Email người được mời"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="example@gmail.com"
            required
          />
          <Select
            label="Quyền hạn"
            value={form.role}
            options={ROLE_OPTIONS}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          />
          <Select
            label="Thời hạn link mời"
            value={form.expiresIn}
            options={[
              { value: "1", label: "1 ngày" },
              { value: "3", label: "3 ngày" },
              { value: "7", label: "7 ngày (mặc định)" },
              { value: "14", label: "14 ngày" },
              { value: "30", label: "30 ngày" },
            ]}
            onChange={e => setForm(f => ({ ...f, expiresIn: e.target.value }))}
          />
          <div>
            <label className="label">Lời nhắn (tuỳ chọn)</label>
            <textarea
              className="input min-h-[72px] resize-none"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Ví dụ: Bạn được thêm vào với vai trò giảng viên..."
            />
          </div>
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>Lưu ý:</strong> Hệ thống sẽ gửi email kèm link kích hoạt đến địa chỉ trên.
            Nếu chưa cấu hình SMTP, link sẽ được log ra console (mode preview).
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>
              <Mail className="w-4 h-4" /> Gửi lời mời
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
