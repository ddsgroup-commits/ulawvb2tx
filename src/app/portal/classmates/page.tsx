"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Lock, UserCheck } from "lucide-react";

interface Classmate {
  id: string;
  name: string;
  mssv: string | null;
  email: string;
  role: string;
  learningGroup: string | null;
  // Privacy-gated fields (null if not shared)
  phone: string | null;
  zalo: string | null;
  personalEmail: string | null;
  workplace: string | null;
  jobTitle: string | null;
  city: string | null;
  bio: string | null;
  linkedin: string | null;
  facebook: string | null;
  shareAvatar: boolean;
}

interface PrivacySettings {
  sharePhone: boolean;
  shareZalo: boolean;
  sharePersonalEmail: boolean;
  shareWorkplace: boolean;
  shareJobTitle: boolean;
  shareCity: boolean;
  shareBio: boolean;
  shareSocialLinks: boolean;
  shareAvatar: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
  CREATOR: "Creator", LECTURER: "Giảng viên", STUDENT: "Sinh viên",
  PENDING_USER: "Chờ duyệt",
};

export default function ClassmatesPage() {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [myPrivacy, setMyPrivacy] = useState<PrivacySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    fetch("/api/classmates")
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setClassmates(j.data);
          const gs = [...new Set(j.data.map((c: Classmate) => c.learningGroup).filter(Boolean))] as string[];
          setGroups(gs);
        }
        setLoading(false);
      });
    fetch("/api/classmates/privacy")
      .then(r => r.json())
      .then(j => j.ok && setMyPrivacy(j.data));
  }, []);

  async function savePrivacy() {
    if (!myPrivacy) return;
    setSaving(true);
    await fetch("/api/classmates/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(myPrivacy),
    });
    setSaving(false);
    setShowPrivacy(false);
  }

  const filtered = classmates.filter(c => {
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.mssv ?? "").includes(q) || (c.email ?? "").toLowerCase().includes(q.toLowerCase());
    const matchG = !groupFilter || c.learningGroup === groupFilter;
    return matchQ && matchG;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-hero">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white mb-1">👥 Danh bạ lớp</h1>
            <p className="text-white/70 text-sm">
              Chỉ thành viên đã đăng nhập được xem · Thông tin cá nhân chỉ hiển thị khi bạn đồng ý
            </p>
          </div>
          <button onClick={() => setShowPrivacy(true)}
            className="btn btn-sm border border-white/30 text-white hover:bg-white/10 shrink-0">
            <Shield className="w-4 h-4" /> Quyền riêng tư
          </button>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="card p-4 bg-navy/5 border-navy/10 flex items-start gap-3">
        <Lock className="w-5 h-5 text-navy shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-navy">Bảo mật thông tin:</span> Thông tin cá nhân của bạn
          chỉ hiển thị cho các thành viên đã đăng nhập khi bạn chủ động cho phép chia sẻ.
          Nếu không bật chia sẻ, hệ thống chỉ hiển thị họ tên và mã số sinh viên.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên, MSSV..."
            className="input pl-9"
          />
        </div>
        {groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="input max-w-[200px]"
          >
            <option value="">Tất cả nhóm</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-slate-400">
        Hiển thị <span className="font-semibold text-slate-600">{filtered.length}</span> trên {classmates.length} thành viên
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p className="empty-state-text">Không tìm thấy thành viên nào</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <ClassmateCard key={c.id} classmate={c} />
          ))}
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacy && myPrivacy && (
        <div className="modal-overlay" onClick={() => setShowPrivacy(false)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="font-bold text-navy-dark">Cài đặt quyền riêng tư</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn thông tin bạn muốn chia sẻ với các thành viên trong lớp
                </p>
              </div>
              <button onClick={() => setShowPrivacy(false)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { key: "shareAvatar", label: "Ảnh đại diện", desc: "Hiển thị ảnh hồ sơ của bạn" },
                { key: "sharePhone", label: "Số điện thoại", desc: "Cho phép xem số di động" },
                { key: "shareZalo", label: "Zalo", desc: "Cho phép kết nối qua Zalo" },
                { key: "sharePersonalEmail", label: "Email cá nhân", desc: "Email ngoài portal" },
                { key: "shareWorkplace", label: "Nơi làm việc", desc: "Công ty, tổ chức" },
                { key: "shareJobTitle", label: "Chức vụ", desc: "Vị trí công tác" },
                { key: "shareCity", label: "Tỉnh/Thành phố", desc: "Khu vực sinh sống" },
                { key: "shareBio", label: "Giới thiệu bản thân", desc: "Mô tả ngắn về bạn" },
                { key: "shareSocialLinks", label: "LinkedIn & Facebook", desc: "Mạng xã hội chuyên nghiệp" },
              ].map(item => (
                <label key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={myPrivacy[item.key as keyof PrivacySettings] as boolean}
                    onChange={e => setMyPrivacy(p => p ? {...p, [item.key]: e.target.checked} : p)}
                    className="w-4 h-4 rounded accent-navy"
                  />
                </label>
              ))}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => setShowPrivacy(false)} className="btn-outline flex-1">Hủy</button>
                <button onClick={savePrivacy} disabled={saving} className="btn-primary flex-1">
                  {saving ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassmateCard({ classmate: c }: { classmate: Classmate }) {
  const initials = c.name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        {c.shareAvatar ? (
          <div className="avatar-lg bg-navy text-white shrink-0">{initials}</div>
        ) : (
          <div className="avatar-lg bg-slate-100 text-slate-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-navy-dark text-sm leading-tight">{c.name}</div>
          {c.mssv && <div className="font-mono text-xs text-slate-500 mt-0.5">{c.mssv}</div>}
          <div className={`role-badge role-${c.role} mt-1.5`}>
            {ROLE_LABELS[c.role] ?? c.role}
          </div>
        </div>
      </div>

      {c.learningGroup && (
        <div className="badge-navy text-[10px] mb-3">👥 {c.learningGroup}</div>
      )}

      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 w-4">📧</span>
          <span className="truncate">{c.email}</span>
        </div>
        {c.phone && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-4">📱</span>
            <a href={`tel:${c.phone}`} className="hover:text-navy">{c.phone}</a>
          </div>
        )}
        {c.zalo && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-4">💬</span>
            <span>{c.zalo}</span>
          </div>
        )}
        {c.workplace && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-4">🏢</span>
            <span className="truncate">{c.workplace}{c.jobTitle ? ` · ${c.jobTitle}` : ""}</span>
          </div>
        )}
        {c.city && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-4">📍</span>
            <span>{c.city}</span>
          </div>
        )}
      </div>

      {c.bio && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed line-clamp-3">
          {c.bio}
        </p>
      )}

      {(c.linkedin || c.facebook) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          {c.linkedin && (
            <a href={c.linkedin} target="_blank" rel="noopener noreferrer"
              className="btn-outline btn-sm flex-1">in LinkedIn</a>
          )}
          {c.facebook && (
            <a href={c.facebook} target="_blank" rel="noopener noreferrer"
              className="btn-outline btn-sm flex-1">fb Facebook</a>
          )}
        </div>
      )}
    </div>
  );
}
