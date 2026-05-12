"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, ROLE_COLORS } from "@/lib/utils";
import { Activity, Search, Filter, ChevronLeft, ChevronRight, User, Clock, Cpu } from "lucide-react";
import type { Role } from "@prisma/client";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100  text-blue-700",
  PATCH:  "bg-blue-100  text-blue-700",
  DELETE: "bg-red-100   text-red-600",
  LOGIN:  "bg-purple-100 text-purple-700",
  ACCEPT: "bg-teal-100  text-teal-700",
};

function actionColor(action: string) {
  for (const [k, v] of Object.entries(ACTION_COLORS)) {
    if (action.startsWith(k)) return v;
  }
  return "bg-slate-100 text-slate-600";
}

interface LogUser { id: string; name: string | null; email: string; role: Role; }
interface AuditEntry {
  id:         string;
  action:     string;
  entityType: string;
  entityId:   string | null;
  meta:       Record<string, unknown> | null;
  ip:         string | null;
  userAgent:  string | null;
  createdAt:  string;
  user:       LogUser;
}
interface PaginatedLogs {
  logs:       AuditEntry[];
  total:      number;
  page:       number;
  totalPages: number;
}

export default function AdminAuditPage() {
  const [data, setData]         = useState<PaginatedLogs | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [entityFilter, setEF]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "50",
    });
    if (search)     params.set("action",     search);
    if (entityFilter) params.set("entityType", entityFilter);
    if (dateFrom)   params.set("from",       dateFrom);
    if (dateTo)     params.set("to",         dateTo);

    const res = await fetch(`/api/audit?${params}`);
    const j   = await res.json();
    if (j.ok) setData(j.data);
    setLoading(false);
  }, [page, search, entityFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, entityFilter, dateFrom, dateTo]);

  const ENTITY_TYPES = [
    "Announcement", "Event", "Course", "LibraryItem",
    "FAQ", "User", "AdminInvitation", "SiteConfig",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <Activity className="w-5 h-5 text-navy" />
          Nhật ký hoạt động
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {data ? `${data.total.toLocaleString("vi-VN")} hoạt động được ghi lại` : "Đang tải..."}
        </p>
      </div>

      {/* Filters */}
      <div className="card px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              className="input pl-8 text-sm h-9"
              placeholder="Tìm theo action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Entity type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              className="input pl-8 text-sm h-9 appearance-none"
              value={entityFilter}
              onChange={e => setEF(e.target.value)}
            >
              <option value="">Tất cả entity</option>
              {ENTITY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {/* Date from */}
          <input
            className="input text-sm h-9"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder="Từ ngày"
          />
          {/* Date to */}
          <input
            className="input text-sm h-9"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            placeholder="Đến ngày"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th><Clock className="w-3.5 h-3.5 inline mr-1" />Thời gian</th>
                <th><User className="w-3.5 h-3.5 inline mr-1" />Người dùng</th>
                <th>Hành động</th>
                <th>Entity</th>
                <th>Chi tiết</th>
                <th><Cpu className="w-3.5 h-3.5 inline mr-1" />IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">Đang tải...</td>
                </tr>
              ) : !data || data.logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : data.logs.map(log => (
                <tr key={log.id}>
                  {/* Time */}
                  <td className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  {/* User */}
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-navy">
                        {(log.user.name ?? log.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate max-w-[100px]">
                          {log.user.name ?? "—"}
                        </div>
                        <span className={cn("badge text-[9px] px-1 py-0", ROLE_COLORS[log.user.role] ?? "bg-slate-100 text-slate-500")}>
                          {log.user.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  {/* Action */}
                  <td>
                    <span className={cn("badge font-mono text-[10px] px-2 py-0.5", actionColor(log.action))}>
                      {log.action}
                    </span>
                  </td>
                  {/* Entity */}
                  <td className="text-xs text-slate-600">
                    <span className="font-medium">{log.entityType}</span>
                    {log.entityId && (
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">
                        {log.entityId.slice(0, 8)}…
                      </div>
                    )}
                  </td>
                  {/* Meta */}
                  <td className="text-xs text-slate-500 max-w-[180px]">
                    {log.meta
                      ? Object.entries(log.meta)
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <span key={k} className="mr-1">
                              <span className="text-slate-400">{k}:</span>{" "}
                              <span className="text-slate-600">{String(v).slice(0, 20)}</span>
                            </span>
                          ))
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  {/* IP */}
                  <td className="text-xs font-mono text-slate-400">
                    {log.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {data.page}/{data.totalPages} · {data.total} bản ghi
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
