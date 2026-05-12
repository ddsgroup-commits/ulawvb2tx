"use client";

import { useState, useEffect } from "react";
import { Shield, Search, Download } from "lucide-react";

type AuditAction =
  | "USER_CREATED" | "USER_APPROVED" | "USER_REJECTED" | "USER_ROLE_CHANGED" | "USER_DEACTIVATED"
  | "CONTENT_SUBMITTED" | "CONTENT_APPROVED" | "CONTENT_REJECTED" | "CONTENT_PUBLISHED" | "CONTENT_DELETED" | "CONTENT_ARCHIVED"
  | "ADMIN_LOGIN" | "CALENDAR_SYNC" | "VIDEO_CHANGED" | "DOCUMENT_CHANGED"
  | "PRIVACY_CHANGED" | "GOOGLE_LINKED" | "GOOGLE_UNLINKED" | "SYSTEM_SETTING_CHANGED";

interface AuditLog {
  id: string;
  action: AuditAction;
  actor: { name: string | null; email: string } | null;
  target: { name: string | null; email: string } | null;
  entity: string | null;
  entityId: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_ICONS: Partial<Record<AuditAction, string>> = {
  USER_CREATED: "👤", USER_APPROVED: "✅", USER_REJECTED: "❌", USER_ROLE_CHANGED: "🔄",
  USER_DEACTIVATED: "🚫", CONTENT_SUBMITTED: "📤", CONTENT_APPROVED: "✅", CONTENT_REJECTED: "❌",
  CONTENT_PUBLISHED: "🚀", CONTENT_DELETED: "🗑️", ADMIN_LOGIN: "🔐", CALENDAR_SYNC: "📅",
  VIDEO_CHANGED: "🎬", DOCUMENT_CHANGED: "📄", PRIVACY_CHANGED: "🔒",
  GOOGLE_LINKED: "🔗", GOOGLE_UNLINKED: "🔓", SYSTEM_SETTING_CHANGED: "⚙️",
};

const ACTION_LABELS: Record<AuditAction, string> = {
  USER_CREATED: "Tạo người dùng", USER_APPROVED: "Phê duyệt người dùng",
  USER_REJECTED: "Từ chối người dùng", USER_ROLE_CHANGED: "Thay đổi vai trò",
  USER_DEACTIVATED: "Vô hiệu hóa người dùng", CONTENT_SUBMITTED: "Nộp nội dung",
  CONTENT_APPROVED: "Duyệt nội dung", CONTENT_REJECTED: "Từ chối nội dung",
  CONTENT_PUBLISHED: "Xuất bản nội dung", CONTENT_DELETED: "Xóa nội dung",
  CONTENT_ARCHIVED: "Lưu trữ nội dung", ADMIN_LOGIN: "Đăng nhập admin",
  CALENDAR_SYNC: "Đồng bộ lịch", VIDEO_CHANGED: "Thay đổi video",
  DOCUMENT_CHANGED: "Thay đổi tài liệu", PRIVACY_CHANGED: "Thay đổi quyền riêng tư",
  GOOGLE_LINKED: "Liên kết Google", GOOGLE_UNLINKED: "Hủy liên kết Google",
  SYSTEM_SETTING_CHANGED: "Thay đổi cài đặt hệ thống",
};

const ACTION_COLORS: Partial<Record<AuditAction, string>> = {
  USER_APPROVED: "text-emerald-600", CONTENT_PUBLISHED: "text-emerald-600",
  USER_REJECTED: "text-red-600", CONTENT_REJECTED: "text-red-600", CONTENT_DELETED: "text-red-600",
  USER_DEACTIVATED: "text-red-600", USER_ROLE_CHANGED: "text-amber-600",
  ADMIN_LOGIN: "text-blue-600", SYSTEM_SETTING_CHANGED: "text-purple-600",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const PAGE_SIZE = 30;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (actionFilter) params.set("action", actionFilter);
    fetch(`/api/audit?${params}`)
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setLogs(j.data.items);
          setTotal(j.data.total);
        }
        setLoading(false);
      });
  }, [q, actionFilter, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <Shield className="w-5 h-5" /> Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Lịch sử hoạt động hệ thống · {total.toLocaleString("vi-VN")} sự kiện
          </p>
        </div>
        <button className="btn-outline btn-sm">
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Tìm theo email, hành động..."
            className="input pl-9"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value as AuditAction | ""); setPage(1); }}
          className="input max-w-[240px]"
        >
          <option value="">Tất cả hành động</option>
          {(Object.keys(ACTION_LABELS) as AuditAction[]).map(a => (
            <option key={a} value={a}>{ACTION_ICONS[a]} {ACTION_LABELS[a]}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Hành động</th>
                <th>Người thực hiện</th>
                <th>Đối tượng / Entity</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 8}).map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="skeleton h-8 w-full" /></td></tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Không có log nào
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap">
                      <div className="text-xs text-slate-700 font-medium">
                        {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString("vi-VN", {hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                      </div>
                    </td>
                    <td>
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${ACTION_COLORS[log.action] ?? "text-slate-700"}`}>
                        <span>{ACTION_ICONS[log.action] ?? "📋"}</span>
                        <span>{ACTION_LABELS[log.action]}</span>
                      </div>
                    </td>
                    <td>
                      {log.actor ? (
                        <div>
                          <div className="text-xs font-medium text-slate-700">{log.actor.name ?? log.actor.email}</div>
                          <div className="text-[10px] text-slate-400">{log.actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">Hệ thống</span>
                      )}
                    </td>
                    <td>
                      {log.target && (
                        <div>
                          <div className="text-xs text-slate-600">{log.target.name ?? log.target.email}</div>
                        </div>
                      )}
                      {log.entity && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.entity}{log.entityId ? ` #${log.entityId.slice(0,8)}` : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-[10px] text-slate-400 font-mono">{log.ipAddress ?? "—"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Trang {page}/{totalPages} · {total} sự kiện
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline btn-sm px-3 disabled:opacity-40">
                ←
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline btn-sm px-3 disabled:opacity-40">
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
