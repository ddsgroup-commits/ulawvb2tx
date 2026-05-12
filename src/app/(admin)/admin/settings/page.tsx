"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, RefreshCw } from "lucide-react";

interface Config {
  className: string;
  semester: string;
  contactEmail: string;
  googleCalendar: string;
  formUpdate: string;
  zaloGroup: string;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config>({
    className: "",
    semester: "",
    contactEmail: "",
    googleCalendar: "",
    formUpdate: "",
    zaloGroup: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const j = await res.json();
        if (j.ok) setConfig(j.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConfig(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) return <div className="skeleton h-64 w-full" />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark">Cài đặt hệ thống</h1>
        <p className="text-slate-500 text-sm">Cấu hình thông tin lớp học và đường dẫn</p>
      </div>

      {success && (
        <div className="notice-success">✅ Đã lưu cài đặt thành công!</div>
      )}

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Thông tin lớp học
        </div>
        <Input
          label="Tên lớp"
          value={config.className}
          onChange={e => setConfig(c => ({ ...c, className: e.target.value }))}
          placeholder="VB2 Luật – ULAW HCM 2025"
        />
        <Input
          label="Học kỳ hiện tại"
          value={config.semester}
          onChange={e => setConfig(c => ({ ...c, semester: e.target.value }))}
          placeholder="Học kỳ I – 2026"
        />
        <Input
          label="Email liên hệ lớp"
          type="email"
          value={config.contactEmail}
          onChange={e => setConfig(c => ({ ...c, contactEmail: e.target.value }))}
        />

        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Đường dẫn ngoài
          </div>
          <div className="space-y-4">
            <Input
              label="Google Calendar lớp"
              value={config.googleCalendar}
              onChange={e => setConfig(c => ({ ...c, googleCalendar: e.target.value }))}
              placeholder="https://calendar.google.com/..."
            />
            <Input
              label="Form cập nhật thông tin"
              value={config.formUpdate}
              onChange={e => setConfig(c => ({ ...c, formUpdate: e.target.value }))}
              placeholder="https://forms.gle/..."
            />
            <Input
              label="Nhóm Zalo lớp"
              value={config.zaloGroup}
              onChange={e => setConfig(c => ({ ...c, zaloGroup: e.target.value }))}
              placeholder="https://zalo.me/g/..."
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={loadConfig}>
            <RefreshCw className="w-4 h-4" /> Tải lại
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" /> Lưu cài đặt
          </Button>
        </div>
      </form>
    </div>
  );
}
