"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday, isSameMonth,
  startOfDay, addDays
} from "date-fns";
import { vi } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { cn, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, formatDateVi, daysUntil } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar, CheckCircle2, AlertCircle, Loader2, Unlink } from "lucide-react";
import type { EventType } from "@prisma/client";

interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  time?: string;
  room?: string;
  course?: { name: string } | null;
}

interface GCalStatus {
  connected: boolean;
  calendarId?: string;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  connectedAt?: string;
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const TYPE_DOT: Record<EventType, string> = {
  CLASS: "bg-blue-500",
  EXAM: "bg-red-500",
  DEADLINE: "bg-amber-500",
  EVENT: "bg-purple-500",
};

function GoogleCalendarWidget() {
  const [status, setStatus] = useState<GCalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const searchParams = useSearchParams();

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/calendar/google/status");
    const json = await res.json();
    if (json.ok) setStatus(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
    // Handle redirect params from OAuth callback
    const gcal = searchParams.get("gcal");
    if (gcal === "connected") showToast("success", "Google Calendar đã kết nối thành công!");
    else if (gcal === "denied") showToast("error", "Bạn đã từ chối quyền truy cập Google Calendar.");
    else if (gcal === "error") showToast("error", "Đã xảy ra lỗi khi kết nối. Vui lòng thử lại.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/google/sync", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        showToast("success", `Đã đồng bộ ${json.synced}/${json.total} sự kiện${json.errors ? ` (${json.errors} lỗi)` : ""}.`);
        loadStatus();
      } else {
        showToast("error", json.error ?? "Đồng bộ thất bại.");
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Ngắt kết nối Google Calendar? Các sự kiện đã đồng bộ sẽ không bị xóa trên Google.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/calendar/google/disconnect", { method: "POST" });
      showToast("success", "Đã ngắt kết nối Google Calendar.");
      setStatus({ connected: false });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-4 flex items-center gap-3 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang kiểm tra kết nối Google Calendar…
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-3">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
          toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Google Calendar</p>
          <p className="text-xs text-slate-500">
            {status?.connected
              ? `Đã kết nối · ${status.calendarId ?? "primary"}`
              : "Chưa kết nối"}
          </p>
        </div>
        <span className={cn(
          "badge text-[10px]",
          status?.connected ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
        )}>
          {status?.connected ? "Đang kết nối" : "Chưa kết nối"}
        </span>
      </div>

      {status?.connected ? (
        <>
          {status.lastSyncAt && (
            <p className="text-xs text-slate-400">
              Đồng bộ lần cuối: {formatDateVi(status.lastSyncAt)}
            </p>
          )}
          {status.lastSyncError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {status.lastSyncError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary btn-sm flex-1 justify-center"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              {syncing ? "Đang đồng bộ…" : "Đồng bộ ngay"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="btn btn-outline btn-sm px-3"
              title="Ngắt kết nối"
            >
              {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Đồng bộ lịch học, thi và deadline 90 ngày tới vào Google Calendar của bạn.
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Kết nối để tự động đồng bộ lịch học, ngày thi và deadline vào Google Calendar cá nhân.
          </p>
          <a
            href="/api/calendar/google/connect"
            className="btn btn-primary btn-sm w-full justify-center"
          >
            <Calendar className="w-3.5 h-3.5" />
            Kết nối Google Calendar
          </a>
        </>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const res = await fetch(`/api/events?year=${year}&month=${month}`);
    const json = await res.json();
    if (json.ok) setEvents(json.data);
    setLoading(false);
  }, [current]);

  useEffect(() => { load(); }, [load]);

  // Calendar grid
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun
  const totalCells = Math.ceil((days.length + startPad) / 7) * 7;

  const eventsByDate: Record<string, CalEvent[]> = {};
  for (const e of events) {
    const key = e.date.slice(0, 10);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  }

  const now = new Date();
  const weekEvents = events.filter(e => {
    const d = new Date(e.date);
    return d >= startOfDay(now) && d <= addDays(now, 7);
  });
  const deadlines = events
    .filter(e => e.type === "DEADLINE" && new Date(e.date) >= startOfDay(now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Lịch học & Deadline</h1>
        <p className="text-slate-500 text-sm mt-1">Lịch học, thi và deadline theo tháng</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(["CLASS", "EXAM", "DEADLINE", "EVENT"] as EventType[]).map(t => (
          <span key={t} className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className={cn("w-2.5 h-2.5 rounded-full", TYPE_DOT[t])} />
            {EVENT_TYPE_LABELS[t]}
          </span>
        ))}
      </div>

      {/* Two-column layout on large screens: calendar left, widgets right */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Calendar navigation */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button onClick={() => setCurrent(subMonths(current, 1))} className="btn-ghost btn btn-sm p-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-navy-dark text-base">
                {format(current, "MMMM yyyy", { locale: vi })}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrent(new Date())} className="btn btn-outline btn-sm">Hôm nay</button>
                <button onClick={() => setCurrent(addMonths(current, 1))} className="btn-ghost btn btn-sm p-2">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid header */}
            <div className="cal-grid p-3 pb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="cal-grid p-3 pt-0">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayIndex = i - startPad;
                const day = days[dayIndex];
                if (!day) return <div key={i} className="cal-day other-month" />;

                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[key] ?? [];
                const today = isToday(day);
                const inMonth = isSameMonth(day, current);

                return (
                  <div
                    key={key}
                    className={cn(
                      "cal-day",
                      today && "today",
                      !inMonth && "other-month"
                    )}
                  >
                    <div className={cn(
                      "text-[11px] font-semibold mb-0.5 w-5 h-5 rounded-full flex items-center justify-center",
                      today ? "bg-navy text-white" : "text-slate-600"
                    )}>
                      {format(day, "d")}
                    </div>
                    {dayEvents.slice(0, 3).map(e => (
                      <div
                        key={e.id}
                        title={`${e.title}${e.time ? ` · ${e.time}` : ""}`}
                        className={cn("cal-event-dot", EVENT_TYPE_COLORS[e.type])}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-slate-400">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom panels */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* This week */}
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-navy-dark flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> 7 ngày tới
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {weekEvents.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">Không có sự kiện</div>
                ) : (
                  weekEvents.map(e => (
                    <div key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", TYPE_DOT[e.type])} />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{e.title}</div>
                        <div className="text-xs text-slate-500">
                          {formatDateVi(e.date)}{e.time ? ` · ${e.time}` : ""}{e.room ? ` · ${e.room}` : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Deadlines */}
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-navy-dark flex items-center gap-2">
                  ⏰ Deadline sắp tới
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {deadlines.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">Không có deadline 🎉</div>
                ) : (
                  deadlines.map(e => {
                    const days = daysUntil(e.date);
                    return (
                      <div key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{e.title}</div>
                          <div className="text-xs text-slate-500">{formatDateVi(e.date)}</div>
                        </div>
                        <span className={cn(
                          "badge text-xs",
                          days <= 1 ? "bg-red-100 text-red-600" :
                          days <= 3 ? "bg-amber-100 text-amber-600" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {days === 0 ? "Hôm nay" : days === 1 ? "Ngày mai" : `${days} ngày`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar: Google Calendar widget */}
        <div className="xl:w-72 space-y-4 shrink-0">
          <GoogleCalendarWidget />

          {/* How it works */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Cách hoạt động</p>
            <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
              <li>Nhấn <strong>Kết nối Google Calendar</strong></li>
              <li>Đăng nhập & cấp quyền cho ULAW VB2 Portal</li>
              <li>Nhấn <strong>Đồng bộ ngay</strong> để đưa lịch vào Google Calendar</li>
              <li>Lịch học, thi, deadline sẽ xuất hiện trong Google Calendar của bạn</li>
            </ol>
            <p className="text-[11px] text-slate-400 pt-1">
              Chỉ đọc & ghi sự kiện lịch — không truy cập email hay dữ liệu khác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
