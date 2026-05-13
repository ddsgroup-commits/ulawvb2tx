"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Film,
  Library as LibraryIcon,
  Brain,
  Megaphone,
  Calendar,
  Users,
  HelpCircle,
  Globe,
  Lock,
  Wrench,
  KeyRound,
  Loader2,
  Check,
  Save,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Flags {
  // booleans
  lmsEnabled: boolean;
  videoLibraryEnabled: boolean;
  documentLibraryEnabled: boolean;
  aiHubEnabled: boolean;
  announcementsEnabled: boolean;
  scheduleEnabled: boolean;
  contactsEnabled: boolean;
  faqEnabled: boolean;
  publicHomepageEnabled: boolean;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  forcePasswordReset: boolean;
  // strings
  className: string;
  semester: string;
  contactEmail: string;
  zaloGroupUrl: string;
  googleCalendarUrl: string;
  maintenanceMessage: string;
  topBannerText: string;
}

type FlagKey = keyof Flags;

const MODULES: Array<{
  key: FlagKey;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  { key: "lmsEnabled", label: "E-learning (LMS)", description: "Bài học, tiến độ, ghi chú cá nhân", icon: GraduationCap, color: "bg-blue-50 text-blue-700" },
  { key: "videoLibraryEnabled", label: "Video bài giảng", description: "Thư viện video YouTube + Google Drive", icon: Film, color: "bg-red-50 text-red-700" },
  { key: "documentLibraryEnabled", label: "Thư viện tài liệu", description: "Văn bản, giáo trình, đề thi, lecture notes", icon: LibraryIcon, color: "bg-emerald-50 text-emerald-700" },
  { key: "aiHubEnabled", label: "AI Study Hub", description: "Tích hợp NotebookLM / AI ôn tập", icon: Brain, color: "bg-purple-50 text-purple-700" },
  { key: "announcementsEnabled", label: "Thông báo", description: "Bảng thông báo lớp", icon: Megaphone, color: "bg-amber-50 text-amber-700" },
  { key: "scheduleEnabled", label: "Lịch học & Deadline", description: "Lịch tuần và deadline", icon: Calendar, color: "bg-indigo-50 text-indigo-700" },
  { key: "contactsEnabled", label: "Danh bạ lớp", description: "Ban cán sự & nhóm học tập", icon: Users, color: "bg-cyan-50 text-cyan-700" },
  { key: "faqEnabled", label: "FAQ & Hướng dẫn", description: "Câu hỏi thường gặp", icon: HelpCircle, color: "bg-slate-100 text-slate-700" },
];

const BEHAVIOUR: Array<{ key: FlagKey; label: string; description: string; icon: React.ElementType; warning?: string }> = [
  { key: "publicHomepageEnabled", label: "Trang chủ công khai", description: "Hiển thị homepage tĩnh cho khách chưa đăng nhập", icon: Globe },
  { key: "registrationEnabled", label: "Cho phép tự đăng ký", description: "Sinh viên có thể tự tạo tài khoản (tương lai)", icon: KeyRound },
  { key: "forcePasswordReset", label: "Bắt đổi mật khẩu lần đầu", description: "Sinh viên phải đổi mật khẩu mặc định khi đăng nhập lần đầu", icon: Lock },
  { key: "maintenanceMode", label: "Chế độ bảo trì", description: "Khóa toàn site & hiển thị thông báo bảo trì", icon: Wrench, warning: "Khi bật, sinh viên không truy cập được portal." },
];

export default function ControlPanelPage() {
  const [flags, setFlags] = useState<Flags | null>(null);
  const [draft, setDraft] = useState<Flags | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/control-panel");
    const json = await res.json();
    if (json.ok) {
      setFlags(json.data);
      setDraft(json.data);
    } else {
      setError(json.error ?? "Không tải được cấu hình");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function patchDraft<K extends FlagKey>(key: K, value: Flags[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  const dirty = flags && draft && JSON.stringify(flags) !== JSON.stringify(draft);

  async function save() {
    if (!draft || !flags) return;
    setSaving(true);
    setError(null);

    // Send only changed keys to keep the audit log tight.
    const patch: Record<string, boolean | string> = {};
    for (const k of Object.keys(draft) as FlagKey[]) {
      if (draft[k] !== flags[k]) patch[k] = draft[k];
    }

    const res = await fetch("/api/control-panel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setError(json.error ?? "Lưu không thành công");
      return;
    }
    setFlags(json.data);
    setDraft(json.data);
    setSavedAt(Date.now());
  }

  function discard() {
    if (flags) setDraft(flags);
  }

  if (loading || !flags || !draft) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Control Panel</h1>
          <p className="text-slate-500 text-sm">Đang tải cấu hình…</p>
        </div>
        <div className="card p-10 flex items-center justify-center text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> Control Panel
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Bật/tắt nhanh từng tính năng của portal và homepage. Thay đổi áp dụng tức thì — không cần build lại.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && !dirty && (
            <span className="text-xs text-green-600 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Đã lưu
            </span>
          )}
          {dirty && (
            <button
              type="button"
              onClick={discard}
              className="btn btn-ghost btn-sm"
              disabled={saving}
            >
              Hủy thay đổi
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {error && (
        <div className="notice-danger text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
        </div>
      )}

      {/* Maintenance banner */}
      {draft.maintenanceMode && (
        <div className="notice-warn">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          <strong>Chế độ bảo trì đang BẬT.</strong> Sinh viên hiện không truy cập được portal khi cấu hình này có hiệu lực.
        </div>
      )}

      {/* ── Modules ─────────────────────────────────── */}
      <section>
        <h2 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3">
          Module chính của portal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODULES.map((m) => (
            <ToggleRow
              key={m.key}
              icon={m.icon}
              iconClass={m.color}
              title={m.label}
              description={m.description}
              checked={!!draft[m.key]}
              onChange={(v) => patchDraft(m.key, v as never)}
            />
          ))}
        </div>
      </section>

      {/* ── Behaviour ─────────────────────────────── */}
      <section>
        <h2 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3">
          Hành vi hệ thống
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BEHAVIOUR.map((m) => (
            <ToggleRow
              key={m.key}
              icon={m.icon}
              iconClass="bg-slate-100 text-slate-700"
              title={m.label}
              description={m.description}
              warning={m.warning}
              checked={!!draft[m.key]}
              onChange={(v) => patchDraft(m.key, v as never)}
            />
          ))}
        </div>
      </section>

      {/* ── Class info ─────────────────────────── */}
      <section className="card p-5">
        <h2 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-4">
          Thông tin lớp & liên hệ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tên lớp"
            value={draft.className}
            onChange={(e) => patchDraft("className", e.target.value)}
          />
          <Input
            label="Học kỳ"
            value={draft.semester}
            onChange={(e) => patchDraft("semester", e.target.value)}
          />
          <Input
            label="Email liên hệ"
            type="email"
            value={draft.contactEmail}
            onChange={(e) => patchDraft("contactEmail", e.target.value)}
          />
          <Input
            label="Nhóm Zalo (URL)"
            type="url"
            value={draft.zaloGroupUrl}
            onChange={(e) => patchDraft("zaloGroupUrl", e.target.value)}
            placeholder="https://zalo.me/g/…"
          />
          <Input
            label="Google Calendar lớp (URL)"
            type="url"
            value={draft.googleCalendarUrl}
            onChange={(e) => patchDraft("googleCalendarUrl", e.target.value)}
            placeholder="https://calendar.google.com/…"
          />
        </div>
      </section>

      {/* ── Banners & messages ─────────────────── */}
      <section className="card p-5">
        <h2 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-4">
          Thông báo hệ thống
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Banner trên cùng (toàn portal)</label>
            <input
              type="text"
              className="input"
              value={draft.topBannerText}
              onChange={(e) => patchDraft("topBannerText", e.target.value)}
              placeholder="VD: 📢 Tuần này nghỉ học vì lễ — xem lịch chi tiết trong portal."
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Để trống nếu không muốn hiển thị banner. Banner xuất hiện trên dashboard của tất cả sinh viên.
            </p>
          </div>
          <div>
            <label className="label">Thông báo chế độ bảo trì</label>
            <textarea
              className="input min-h-[80px]"
              value={draft.maintenanceMessage}
              onChange={(e) => patchDraft("maintenanceMessage", e.target.value)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Hiển thị khi <strong>maintenanceMode</strong> được bật.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky save bar at bottom on mobile */}
      {dirty && (
        <div className="sticky bottom-4 z-30 lg:hidden">
          <div className="card p-3 flex items-center justify-between shadow-xl">
            <span className="text-sm text-slate-600">Có thay đổi chưa lưu</span>
            <div className="flex gap-2">
              <button onClick={discard} className="btn btn-ghost btn-sm" disabled={saving}>
                Hủy
              </button>
              <button onClick={save} className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle row component ────────────────────────────────────
function ToggleRow({
  icon: Icon,
  iconClass,
  title,
  description,
  checked,
  onChange,
  warning,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warning?: string;
}) {
  return (
    <label className="card p-4 flex items-start gap-3 cursor-pointer hover:shadow-card-hover transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          <Switch checked={checked} onChange={onChange} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</p>
        {warning && checked && (
          <p className="text-[11px] text-amber-700 mt-1.5 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {warning}
          </p>
        )}
      </div>
    </label>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-navy" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform translate-y-0.5 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
