"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  type: string;
  location: string | null;
  isExam: boolean;
  course: { name: string; slug: string; color: string | null } | null;
}

const EVENT_COLORS: Record<string, string> = {
  EXAM: "bg-red-100 text-red-800 border-red-200",
  DEADLINE: "bg-orange-100 text-orange-800 border-orange-200",
  CLASS: "bg-blue-100 text-blue-800 border-blue-200",
  MAKEUP: "bg-purple-100 text-purple-800 border-purple-200",
  OTHER: "bg-slate-100 text-slate-700 border-slate-200",
};

const EVENT_LABELS: Record<string, string> = {
  EXAM: "Thi", DEADLINE: "Nộp bài", CLASS: "Học", MAKEUP: "Học bù", OTHER: "Khác",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetch("/api/events?pageSize=100")
      .then(r => r.json())
      .then(j => { if (j.ok) setEvents(j.data); setLoading(false); });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const startOffset = (firstDayOfMonth + 6) % 7; // Make Monday = 0

  const monthEvents = events.filter(e => {
    const d = new Date(e.startAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  function getEventsForDay(day: number): CalendarEvent[] {
    return monthEvents.filter(e => new Date(e.startAt).getDate() === day);
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

  // Upcoming events list (next 30 days)
  const upcoming = events
    .filter(e => new Date(e.startAt) >= today)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <Calendar className="w-5 h-5 text-ulaw" /> Lịch học
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Lịch thi, nộp bài và các sự kiện lớp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy-dark">
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                Hôm nay
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day}
                  className={`min-h-[56px] p-1 rounded-xl border transition-colors ${
                    isToday(day)
                      ? "border-navy bg-navy/5"
                      : "border-transparent hover:bg-slate-50"
                  }`}>
                  <div className={`text-xs font-bold mb-1 text-center w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                    isToday(day) ? "bg-navy text-white" : "text-slate-600"
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <div
                        key={e.id}
                        title={e.title}
                        className={`text-[9px] font-medium px-1 py-0.5 rounded truncate border ${EVENT_COLORS[e.type] ?? EVENT_COLORS.OTHER}`}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-400 text-center">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="space-y-4">
          <div className="section-title">Sắp diễn ra</div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="card p-4"><div className="skeleton h-16 w-full" /></div>)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="card p-6 text-center text-slate-400 text-sm">Không có sự kiện nào</div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(event => {
                const d = new Date(event.startAt);
                const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={event.id} className={`card p-4 border-l-4 ${
                    event.isExam ? "border-l-red-500" :
                    event.type === "DEADLINE" ? "border-l-orange-400" :
                    "border-l-navy"
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${EVENT_COLORS[event.type] ?? ""}`}>
                        {EVENT_LABELS[event.type] ?? event.type}
                      </span>
                      <span className={`text-[10px] font-semibold ${daysLeft <= 3 ? "text-ulaw" : "text-slate-400"}`}>
                        {daysLeft === 0 ? "Hôm nay" : daysLeft === 1 ? "Ngày mai" : `${daysLeft} ngày`}
                      </span>
                    </div>
                    <div className="font-bold text-navy-dark text-sm">{event.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {d.toLocaleDateString("vi-VN")} · {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                      {event.course && (
                        <div className="text-navy/70">{event.course.name}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
