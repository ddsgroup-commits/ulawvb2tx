"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Globe, Layout, BarChart3, ListChecks, Link as LinkIcon, X, Plus } from "lucide-react";

interface SiteConfig {
  id: string;
  siteName: string;
  siteDescription: string | null;
  contactEmail: string | null;
  zaloGroupUrl: string | null;
  facebookGroupUrl: string | null;
  maintenanceMode: boolean;
  heroTitle: string | null;
  heroSubtitle: string | null;
  stats: any[] | null;
  features: any[] | null;
  quickLinks: any[] | null;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"general" | "homepage">("general");

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

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="card p-6"><div className="skeleton h-20 w-full" /></div>)}</div>;
  if (!config) return null;

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <Settings className="w-5 h-5" /> Cài đặt hệ thống
        </h1>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button onClick={() => setTab("general")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${tab === "general" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}>
            Tổng quan
          </button>
          <button onClick={() => setTab("homepage")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${tab === "homepage" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}>
            Trang chủ
          </button>
        </div>
      </div>

      {tab === "general" && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-navy" />
            <span className="font-bold text-navy-dark text-sm">Thông tin hệ thống</span>
          </div>

          <div className="input-group">
            <label className="label">Tên hệ thống</label>
            <input value={config.siteName} onChange={e => setConfig({ ...config, siteName: e.target.value })} className="input" />
          </div>

          <div className="input-group">
            <label className="label">Mô tả SEO</label>
            <textarea value={config.siteDescription ?? ""} onChange={e => setConfig({ ...config, siteDescription: e.target.value })} className="input min-h-[80px] resize-y" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="label">Email liên hệ</label>
              <input type="email" value={config.contactEmail ?? ""} onChange={e => setConfig({ ...config, contactEmail: e.target.value })} className="input" />
            </div>
            <div className="input-group">
              <label className="label">Trạng thái bảo trì</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-600">Bật bảo trì</span>
                <button onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${config.maintenanceMode ? "bg-ulaw" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.maintenanceMode ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="label">Nhóm Zalo</label>
              <input value={config.zaloGroupUrl ?? ""} onChange={e => setConfig({ ...config, zaloGroupUrl: e.target.value })} className="input" />
            </div>
            <div className="input-group">
              <label className="label">Nhóm Facebook</label>
              <input value={config.facebookGroupUrl ?? ""} onChange={e => setConfig({ ...config, facebookGroupUrl: e.target.value })} className="input" />
            </div>
          </div>
        </div>
      )}

      {tab === "homepage" && (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-4 h-4 text-navy" />
              <span className="font-bold text-navy-dark text-sm">Hero Section</span>
            </div>
            <div className="input-group">
              <label className="label">Tiêu đề chính</label>
              <input value={config.heroTitle ?? ""} onChange={e => setConfig({ ...config, heroTitle: e.target.value })} className="input font-bold" />
            </div>
            <div className="input-group">
              <label className="label">Tiêu đề phụ (màu đỏ)</label>
              <input value={config.heroSubtitle ?? ""} onChange={e => setConfig({ ...config, heroSubtitle: e.target.value })} className="input text-ulaw" />
            </div>
          </div>

          {/* Stats Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-navy" />
                <span className="font-bold text-navy-dark text-sm">Số liệu thống kê</span>
              </div>
              <button onClick={() => {
                const s = config.stats || [];
                setConfig({...config, stats: [...s, {value: "0", label: "Mới"}]})
              }} className="btn-sm btn-ghost text-navy"><Plus className="w-4 h-4"/> Thêm</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(config.stats || []).map((s, i) => (
                <div key={i} className="flex gap-2 items-end p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Giá trị</label>
                    <input value={s.value} onChange={e => {
                      const ns = [...(config.stats || [])]; ns[i].value = e.target.value; setConfig({...config, stats: ns});
                    }} className="input input-sm" />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Nhãn</label>
                    <input value={s.label} onChange={e => {
                      const ns = [...(config.stats || [])]; ns[i].label = e.target.value; setConfig({...config, stats: ns});
                    }} className="input input-sm" />
                  </div>
                  <button onClick={() => {
                    const ns = (config.stats || []).filter((_, idx) => idx !== i); setConfig({...config, stats: ns});
                  }} className="p-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-navy" />
                <span className="font-bold text-navy-dark text-sm">Liên kết nhanh</span>
              </div>
              <button onClick={() => {
                const l = config.quickLinks || [];
                setConfig({...config, quickLinks: [...l, {label: "Mới", href: "/"}]})
              }} className="btn-sm btn-ghost text-navy"><Plus className="w-4 h-4"/> Thêm</button>
            </div>
            <div className="space-y-2">
              {(config.quickLinks || []).map((l, i) => (
                <div key={i} className="flex gap-2 items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <input value={l.label} onChange={e => {
                    const nl = [...(config.quickLinks || [])]; nl[i].label = e.target.value; setConfig({...config, quickLinks: nl});
                  }} className="input input-sm flex-1" placeholder="Nhãn" />
                  <input value={l.href} onChange={e => {
                    const nl = [...(config.quickLinks || [])]; nl[i].href = e.target.value; setConfig({...config, quickLinks: nl});
                  }} className="input input-sm flex-[2]" placeholder="Link /portal/..." />
                  <button onClick={() => {
                    const nl = (config.quickLinks || []).filter((_, idx) => idx !== i); setConfig({...config, quickLinks: nl});
                  }} className="p-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 flex items-center gap-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`btn-primary shadow-xl btn-lg px-8 ${saved ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
          <Save className="w-4 h-4" />
          {saved ? "Đã lưu ✓" : saving ? "Đang lưu..." : "Lưu tất cả thay đổi"}
        </button>
      </div>
    </div>
  );
}
