"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCheck, UserX, ChevronDown, Search, Plus, Shield } from "lucide-react";

type Role = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "CREATOR" | "LECTURER" | "STUDENT" | "PENDING_USER";

interface User {
  id: string;
  name: string | null;
  email: string;
  mssv: string | null;
  role: Role;
  isActive: boolean;
  googleEmail: string | null;
  createdAt: string;
  _count: { videos: number; announcements: number };
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
  CREATOR: "Creator", LECTURER: "Giảng viên", STUDENT: "Sinh viên",
  PENDING_USER: "Chờ duyệt",
};

const ALL_ROLES: Role[] = ["SUPER_ADMIN","ADMIN","MODERATOR","CREATOR","LECTURER","STUDENT","PENDING_USER"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<"active" | "pending" | "">("");
  const [saving, setSaving] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("STUDENT");
  const [inviteNote, setInviteNote] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "100" });
    if (q) params.set("q", q);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter === "pending") params.set("isActive", "false");
    if (statusFilter === "active") params.set("isActive", "true");
    const res = await fetch(`/api/users?${params}`);
    const json = await res.json();
    if (json.ok) setUsers(json.data.items ?? []);
    setLoading(false);
  }, [q, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function approveUser(userId: string) {
    setSaving(userId);
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true, role: "STUDENT" }),
    });
    setSaving(null);
    load();
  }

  async function changeRole(userId: string, role: Role) {
    setSaving(userId);
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSaving(null);
    load();
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    setSaving(userId);
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    setSaving(null);
    load();
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, note: inviteNote }),
    });
    setInviting(false);
    setShowInvite(false);
    setInviteEmail("");
    setInviteNote("");
  }

  const pending = users.filter(u => !u.isActive || u.role === "PENDING_USER");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Người dùng</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {users.length} tài khoản · {pending.length} chờ duyệt
          </p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Mời thành viên
        </button>
      </div>

      {/* Pending users alert */}
      {pending.length > 0 && (
        <div className="card p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-amber-800 text-sm">
              {pending.length} tài khoản chờ duyệt
            </span>
            <span className="text-amber-700 text-sm ml-2">— cần xem xét và phê duyệt</span>
          </div>
          <button onClick={() => setStatusFilter("pending")}
            className="btn-sm border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100">
            Xem ngay
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, MSSV..."
            className="input pl-9"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | "")}
          className="input max-w-[180px]">
          <option value="">Tất cả vai trò</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "active"|"pending"|"")}
          className="input max-w-[160px]">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đã duyệt</option>
          <option value="pending">Chờ duyệt</option>
        </select>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>MSSV</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Google</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton h-8 w-full" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Không tìm thấy người dùng nào</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className={!u.isActive || u.role === "PENDING_USER" ? "bg-amber-50/40" : ""}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-sm">
                          {(u.name ?? u.email)[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-800">{u.name ?? "—"}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-600">{u.mssv ?? "—"}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role]}</span>
                        <div className="relative group">
                          <button className="p-0.5 text-slate-300 hover:text-slate-500">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute right-0 top-5 z-10 hidden group-hover:block bg-white shadow-lg rounded-xl border border-slate-100 py-1 min-w-[150px]">
                            {ALL_ROLES.filter(r => r !== "SUPER_ADMIN").map(r => (
                              <button key={r}
                                onClick={() => changeRole(u.id, r)}
                                disabled={saving === u.id}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
                                {ROLE_LABELS[r]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.isActive && u.role !== "PENDING_USER" ? (
                        <span className="badge-green text-[10px]">✓ Hoạt động</span>
                      ) : (
                        <span className="badge-amber text-[10px]">⏳ Chờ duyệt</span>
                      )}
                    </td>
                    <td>
                      {u.googleEmail ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <span>G</span> Đã liên kết
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        {(!u.isActive || u.role === "PENDING_USER") && (
                          <button
                            onClick={() => approveUser(u.id)}
                            disabled={saving === u.id}
                            className="btn-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            title="Phê duyệt"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(u.id, u.isActive)}
                          disabled={saving === u.id}
                          className={`btn-sm border ${u.isActive
                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                          title={u.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        >
                          <UserX className="w-3.5 h-3.5" />
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

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-navy-dark">Mời thành viên mới</h3>
              <button onClick={() => setShowInvite(false)} className="btn-ghost btn-sm p-1.5">✕</button>
            </div>
            <form onSubmit={sendInvite} className="p-6 space-y-4">
              <div className="input-group">
                <label className="label">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  required className="input" placeholder="user@example.com" />
              </div>
              <div className="input-group">
                <label className="label">Vai trò</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}
                  className="input">
                  {ALL_ROLES.filter(r => r !== "SUPER_ADMIN" && r !== "PENDING_USER").map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Ghi chú (tuỳ chọn)</label>
                <input type="text" value={inviteNote} onChange={e => setInviteNote(e.target.value)}
                  className="input" placeholder="VD: Sinh viên nhóm 2" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowInvite(false)} className="btn-outline flex-1">Hủy</button>
                <button type="submit" disabled={inviting} className="btn-primary flex-1">
                  {inviting ? "Đang gửi..." : "Gửi lời mời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
