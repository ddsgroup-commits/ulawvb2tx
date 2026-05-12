"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  cn, ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, formatDateVi,
} from "@/lib/utils";
import {
  Plus, UserCheck, UserX, ShieldAlert, Search, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Role } from "@prisma/client";

const ALL_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "STUDENT", "PENDING_USER"];

const ROLE_OPTIONS = ALL_ROLES.map((v) => ({ value: v, label: ROLE_LABELS[v] }));
const FILTER_ROLE_OPTIONS = [{ value: "", label: "Tất cả vai trò" }, ...ROLE_OPTIONS];
const FILTER_ACTIVE_OPTIONS = [
  { value: "",      label: "Tất cả trạng thái" },
  { value: "true",  label: "Đang hoạt động" },
  { value: "false", label: "Bị khóa" },
];

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  studentId: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const myRole = (session?.user?.role ?? "STUDENT") as Role;
  const isSuperAdmin = myRole === "SUPER_ADMIN";

  const [users, setUsers]         = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 50, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving]       = useState(false);

  // Filters
  const [q, setQ]           = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [page, setPage]     = useState(1);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{
    type: "role" | "toggle" | "approve" | "reject" | "delete";
    user: UserRow;
    newRole?: Role;
  } | null>(null);
  const [confirmNote, setConfirmNote] = useState("");

  // Create form
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "STUDENT" as Role, studentId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "50",
      ...(q           ? { q }               : {}),
      ...(filterRole   ? { role: filterRole } : {}),
      ...(filterActive ? { active: filterActive } : {}),
    });
    const res = await fetch(`/api/users?${params}`);
    const j   = await res.json();
    if (j.ok) {
      setUsers(j.data.items);
      setPagination({ total: j.data.total, page: j.data.page, pageSize: j.data.pageSize, totalPages: j.data.totalPages });
    }
    setLoading(false);
  }, [q, filterRole, filterActive, page]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setQ(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    setSaving(false);
    if (j.ok) {
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "STUDENT", studentId: "" });
      load();
    } else {
      alert(j.error);
    }
  }

  async function executeConfirm() {
    if (!confirm) return;
    const { type, user, newRole } = confirm;
    setSaving(true);

    if (type === "approve" || type === "reject") {
      await fetch(`/api/users/${user.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type === "approve" ? "approve" : "reject", note: confirmNote }),
      });
    } else if (type === "role" && newRole) {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const j = await res.json();
      if (!j.ok) { alert(j.error); setSaving(false); setConfirm(null); return; }
    } else if (type === "toggle") {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
    } else if (type === "delete") {
      if (!confirm.user.name && !confirmNote) { setSaving(false); return; }
      await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    }

    setSaving(false);
    setConfirm(null);
    setConfirmNote("");
    load();
  }

  function initiateRoleChange(user: UserRow, newRole: Role) {
    // SUPER_ADMIN row: only SUPER_ADMIN actor can change
    if (user.role === "SUPER_ADMIN" && !isSuperAdmin) return;
    // Demoting admin? show warning
    setConfirm({ type: "role", user, newRole });
  }

  const pendingCount = users.filter((u) => u.role === "PENDING_USER" && u.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark">Quản lý Người dùng</h1>
          <p className="text-slate-500 text-sm">
            {pagination.total} tài khoản
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingCount} chờ duyệt
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="w-4 h-4" /> Thêm tài khoản
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, email, MSSV..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="input w-44"
        >
          {FILTER_ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className="input w-44"
        >
          {FILTER_ACTIVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={load} className="btn btn-outline btn-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email / MSSV</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Không tìm thấy tài khoản nào</td></tr>
              ) : users.map((u) => {
                const isSelf = u.id === session?.user?.id;
                const canChangeThisRole = isSuperAdmin || u.role !== "SUPER_ADMIN";

                return (
                  <tr key={u.id} className={cn(u.role === "PENDING_USER" && "bg-amber-50/50")}>
                    <td>
                      <div className="font-medium text-sm text-slate-800">{u.name ?? "—"}</div>
                      {isSelf && <div className="text-[10px] text-slate-400">(bạn)</div>}
                    </td>
                    <td>
                      <div className="text-xs text-slate-600">{u.email}</div>
                      {u.studentId && <div className="text-[10px] text-slate-400">MSSV: {u.studentId}</div>}
                    </td>
                    <td>
                      {canChangeThisRole && !isSelf ? (
                        <select
                          value={u.role}
                          onChange={(e) => initiateRoleChange(u, e.target.value as Role)}
                          className={cn("badge border-0 text-xs cursor-pointer pr-6", ROLE_COLORS[u.role])}
                          title={ROLE_DESCRIPTIONS[u.role]}
                        >
                          {ROLE_OPTIONS.map((o) => {
                            // Hide SUPER_ADMIN option for non-super-admin actors
                            if (o.value === "SUPER_ADMIN" && !isSuperAdmin) return null;
                            return <option key={o.value} value={o.value}>{o.label}</option>;
                          })}
                        </select>
                      ) : (
                        <span className={cn("badge text-xs", ROLE_COLORS[u.role])}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={cn(
                        "badge text-xs",
                        u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      )}>
                        {u.isActive ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{formatDateVi(u.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        {/* Approve/reject pending users */}
                        {u.role === "PENDING_USER" && u.isActive && (
                          <>
                            <button
                              onClick={() => setConfirm({ type: "approve", user: u })}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Phê duyệt"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirm({ type: "reject", user: u })}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Toggle active */}
                        {!isSelf && canChangeThisRole && (
                          <button
                            onClick={() => setConfirm({ type: "toggle", user: u })}
                            title={u.isActive ? "Khóa tài khoản" : "Mở khóa"}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              u.isActive
                                ? "text-amber-500 hover:bg-amber-50"
                                : "text-green-500 hover:bg-green-50"
                            )}
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Delete — SUPER_ADMIN only */}
                        {isSuperAdmin && !isSelf && (
                          <button
                            onClick={() => setConfirm({ type: "delete", user: u })}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            title="Xóa tài khoản"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Trang {pagination.page} / {pagination.totalPages} ({pagination.total} kết quả)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="btn btn-outline btn-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Thêm tài khoản mới">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Họ và tên" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Email" type="email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mật khẩu" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            <Input label="MSSV (tuỳ chọn)" value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} />
          </div>
          <Select label="Vai trò" value={form.role}
            options={ROLE_OPTIONS.filter((o) => o.value !== "SUPER_ADMIN" || isSuperAdmin)}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))} />
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>Tạo tài khoản</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm dialog */}
      {confirm && (
        <Modal
          open
          onClose={() => { setConfirm(null); setConfirmNote(""); }}
          title={
            confirm.type === "approve"  ? "Phê duyệt tài khoản" :
            confirm.type === "reject"   ? "Từ chối tài khoản"   :
            confirm.type === "role"     ? "Thay đổi vai trò"     :
            confirm.type === "toggle"   ? (confirm.user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản") :
            "Xóa tài khoản"
          }
        >
          <div className="space-y-4">
            {confirm.type === "approve" && (
              <p className="text-sm text-slate-600">
                Phê duyệt <strong>{confirm.user.name ?? confirm.user.email}</strong> và cấp quyền truy cập
                portal với vai trò <strong>Sinh viên</strong>?
              </p>
            )}
            {confirm.type === "reject" && (
              <>
                <p className="text-sm text-slate-600">
                  Từ chối đăng ký của <strong>{confirm.user.name ?? confirm.user.email}</strong>?
                  Tài khoản sẽ bị khóa.
                </p>
                <Input
                  label="Ghi chú (tuỳ chọn)"
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="Lý do từ chối..."
                />
              </>
            )}
            {confirm.type === "role" && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Thay đổi vai trò của <strong>{confirm.user.name ?? confirm.user.email}</strong>:
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn("badge text-xs", ROLE_COLORS[confirm.user.role])}>
                    {ROLE_LABELS[confirm.user.role]}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={cn("badge text-xs", ROLE_COLORS[confirm.newRole!])}>
                    {ROLE_LABELS[confirm.newRole!]}
                  </span>
                </div>
                {confirm.user.role === "ADMIN" && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-xs">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    Cảnh báo: hạ cấp một Admin sẽ thu hồi quyền truy cập admin panel của họ ngay lập tức.
                  </div>
                )}
              </div>
            )}
            {confirm.type === "toggle" && (
              <p className="text-sm text-slate-600">
                {confirm.user.isActive
                  ? `Khóa tài khoản của ${confirm.user.name ?? confirm.user.email}? Họ sẽ không thể đăng nhập.`
                  : `Mở khóa tài khoản của ${confirm.user.name ?? confirm.user.email}?`}
              </p>
            )}
            {confirm.type === "delete" && (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  Thao tác này không thể hoàn tác. Tất cả dữ liệu của người dùng sẽ bị xóa vĩnh viễn.
                </div>
                <p className="text-sm text-slate-600">
                  Xóa tài khoản <strong>{confirm.user.name ?? confirm.user.email}</strong>?
                </p>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => { setConfirm(null); setConfirmNote(""); }}>
                Hủy
              </Button>
              <Button
                loading={saving}
                variant={confirm.type === "delete" || confirm.type === "reject" ? "destructive" : "default"}
                onClick={executeConfirm}
              >
                {confirm.type === "approve" ? "Phê duyệt"  :
                 confirm.type === "reject"  ? "Từ chối"    :
                 confirm.type === "role"    ? "Xác nhận"   :
                 confirm.type === "toggle"  ? (confirm.user.isActive ? "Khóa" : "Mở khóa") :
                 "Xóa vĩnh viễn"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
