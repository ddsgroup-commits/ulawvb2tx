"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Globe, Bell } from "lucide-react";

interface SiteConfig {
  id: string;
  siteName: string;
  siteDescription: string | null;
  contactEmail: string | null;
  zaloGroupUrl: string | null;
  facebookGroupUrl: string | null;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(j => { if (j.ok) setConfig(j.data); setLoading(false); });
  }, []);

  async function saveSettings() {
    if (!config) return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-6"><div className="skeleton h-20 w-full" /></div>)}</div>;
  if (!config) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <Settings className="w-5 h-5" /> Cài đặt hệ thống
        </h1>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-navy" />
          <span className="font-bold text-navy-dark text-sm">Thông tin hệ thống</span>
        </div>

        <div className="input-group">
          <label className="label">Tên hệ thống</label>
          <input
            value={config.siteName}
            onChange={e => setConfig({ ...config, siteName: e.target.value })}
            className="input"
          />
        </div>

        <div className="input-group">
          <label className="label">Mô tả</label>
          <textarea
            value={config.siteDescription ?? ""}
            onChange={e => setConfig({ ...config, siteDescription: e.target.value })}
            className="input min-h-[80px] resize-y"
          />
        </div>

        <div className="input-group">
          <label className="label">Email liên hệ</label>
          <input
            type="email"
            value={config.contactEmail ?? ""}
            onChange={e => setConfig({ ...config, contactEmail: e.target.value })}
            className="input"
            placeholder="admin@example.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="label">Nhóm Zalo</label>
            <input
              value={config.zaloGroupUrl ?? ""}
              onChange={e => setConfig({ ...config, zaloGroupUrl: e.target.value })}
              className="input"
              placeholder="https://zalo.me/g/..."
            />
          </div>
          <div className="input-group">
            <label className="label">Nhóm Facebook</label>
            <input
              value={config.facebookGroupUrl ?? ""}
              onChange={e => setConfig({ ...config, facebookGroupUrl: e.target.value })}
              className="input"
              placeholder="https://facebook.com/groups/..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <div className="font-semibold text-sm text-slate-700">Chế độ bảo trì</div>
            <div className="text-xs text-slate-400 mt-0.5">Khi bật, người dùng sẽ thấy thông báo bảo trì</div>
          </div>
          <button
            onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              config.maintenanceMode ? "bg-ulaw" : "bg-slate-300"
            }`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              config.maintenanceMode ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className={`btn-primary w-full ${saved ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
          <Save className="w-4 h-4" />
          {saved ? "Đã lưu ✓" : saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}
