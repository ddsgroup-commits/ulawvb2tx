"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, Facebook, Phone, MapPin, BookOpen, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  googleLinked: boolean;
  profile: {
    mssv: string | null;
    phone: string | null;
    facebookUrl: string | null;
    zaloPhone: string | null;
    bio: string | null;
    hometown: string | null;
  } | null;
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showMssv: boolean;
    showFacebook: boolean;
    showZalo: boolean;
    showBio: boolean;
    showHometown: boolean;
    showRole: boolean;
  } | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
  CREATOR: "Creator", LECTURER: "Giảng viên", STUDENT: "Sinh viên", PENDING_USER: "Chờ duyệt",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "privacy">("info");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [facebook, setFacebook] = useState("");
  const [zalo, setZalo] = useState("");
  const [bio, setBio] = useState("");
  const [hometown, setHometown] = useState("");

  // Privacy state
  const [privacy, setPrivacy] = useState({
    showEmail: true, showPhone: false, showMssv: true, showFacebook: false,
    showZalo: false, showBio: true, showHometown: true, showRole: true,
  });

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(j => {
        if (j.ok && j.data) {
          const u = j.data;
          setProfile(u);
          setName(u.name ?? "");
          setPhone(u.profile?.phone ?? "");
          setFacebook(u.profile?.facebookUrl ?? "");
          setZalo(u.profile?.zaloPhone ?? "");
          setBio(u.profile?.bio ?? "");
          setHometown(u.profile?.hometown ?? "");
          if (u.privacy) setPrivacy(u.privacy);
        }
        setLoading(false);
      });
  }, []);

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, facebookUrl: facebook, zaloPhone: zalo, bio, hometown }),
    });
    setSaving(false);
  }

  async function savePrivacy() {
    setSaving(true);
    await fetch("/api/classmates/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(privacy),
    });
    setSaving(false);
  }

  function togglePrivacy(field: keyof typeof privacy) {
    setPrivacy(p => ({ ...p, [field]: !p[field] }));
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-6"><div className="skeleton h-20 w-full" /></div>)}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <User className="w-5 h-5 text-ulaw" /> Hồ sơ cá nhân
        </h1>
      </div>

      {/* Avatar + basic info */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-navy text-white flex items-center justify-center text-xl font-bold shrink-0">
          {(profile.name ?? profile.email).split(" ").slice(-2).map(w => w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-lg font-extrabold text-navy-dark">{profile.name ?? "Chưa đặt tên"}</div>
          <div className="text-sm text-slate-500">{profile.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-navy text-[11px]">{ROLE_LABELS[profile.role]}</span>
            {profile.profile?.mssv && (
              <span className="text-[11px] text-slate-400">MSSV: {profile.profile.mssv}</span>
            )}
            {profile.googleLinked && (
              <span className="text-[11px] text-emerald-600 font-medium">Google ✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["info", "privacy"] as const).map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-navy text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}>
            {tab === "info" ? "Thông tin" : "Quyền riêng tư"}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <div className="card p-6 space-y-4">
          <div className="input-group">
            <label className="label">Họ và tên</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Nguyễn Văn A" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Điện thoại</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="09xx xxx xxx" />
            </div>
            <div className="input-group">
              <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-green-600" /> Zalo</label>
              <input value={zalo} onChange={e => setZalo(e.target.value)} className="input" placeholder="09xx xxx xxx" />
            </div>
          </div>
          <div className="input-group">
            <label className="label flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook</label>
            <input value={facebook} onChange={e => setFacebook(e.target.value)} className="input" placeholder="https://facebook.com/..." />
          </div>
          <div className="input-group">
            <label className="label flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Quê quán</label>
            <input value={hometown} onChange={e => setHometown(e.target.value)} className="input" placeholder="TP.HCM, Đồng Nai..." />
          </div>
          <div className="input-group">
            <label className="label flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Giới thiệu bản thân</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="input min-h-[80px] resize-y" placeholder="Một vài điều về bạn..." />
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary w-full">
            <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="card p-6 space-y-5">
          <div className="p-3 bg-navy/5 rounded-xl text-xs text-slate-600">
            <span className="font-semibold">Kiểm soát thông tin hiển thị</span> trong danh bạ lớp. Chỉ những trường bạn cho phép mới hiển thị với các thành viên khác.
          </div>

          <div className="space-y-3">
            {([
              { key: "showEmail", label: "Địa chỉ email", icon: "✉️" },
              { key: "showPhone", label: "Số điện thoại", icon: "📱" },
              { key: "showMssv", label: "Mã sinh viên (MSSV)", icon: "🎓" },
              { key: "showFacebook", label: "Facebook", icon: "👤" },
              { key: "showZalo", label: "Zalo", icon: "💬" },
              { key: "showBio", label: "Giới thiệu bản thân", icon: "📝" },
              { key: "showHometown", label: "Quê quán", icon: "📍" },
              { key: "showRole", label: "Vai trò trong lớp", icon: "🏷️" },
            ] as { key: keyof typeof privacy; label: string; icon: string }[]).map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span>{icon}</span>
                  <span className="text-sm text-slate-700">{label}</span>
                </div>
                <button
                  onClick={() => togglePrivacy(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    privacy[key]
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                  {privacy[key] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {privacy[key] ? "Hiển thị" : "Ẩn"}
                </button>
              </div>
            ))}
          </div>

          <button onClick={savePrivacy} disabled={saving} className="btn-primary w-full">
            <Lock className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu cài đặt bảo mật"}
          </button>
        </div>
      )}
    </div>
  );
}
