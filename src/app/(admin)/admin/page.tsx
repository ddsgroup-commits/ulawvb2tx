import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Users, Megaphone, CalendarDays, Library, BookOpen, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [
    userCount, announcementCount, eventCount,
    libraryCount, courseCount,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.announcement.count(),
    prisma.event.count(),
    prisma.libraryItem.count(),
    prisma.course.count(),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = [
    { label: "Người dùng", value: userCount, icon: Users, color: "text-navy bg-navy/10" },
    { label: "Thông báo", value: announcementCount, icon: Megaphone, color: "text-blue-600 bg-blue-100" },
    { label: "Sự kiện", value: eventCount, icon: CalendarDays, color: "text-purple-600 bg-purple-100" },
    { label: "Tài liệu", value: libraryCount, icon: Library, color: "text-green-600 bg-green-100" },
    { label: "Môn học", value: courseCount, icon: BookOpen, color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-dark">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan hệ thống ULAW VB2 Portal</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-navy-dark">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Audit log */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-navy" />
          <h2 className="font-bold text-navy-dark">Nhật ký hoạt động gần đây</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentAuditLogs.length === 0 ? (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">Chưa có hoạt động</div>
          ) : (
            recentAuditLogs.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-xs text-slate-400 w-32 shrink-0">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </div>
                <div className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {log.action}
                </div>
                <div className="text-xs text-slate-500">{log.entityType}</div>
                <div className="text-xs text-slate-400 ml-auto">{log.user.name}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
