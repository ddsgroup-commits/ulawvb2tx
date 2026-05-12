import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart2, Users, BookOpen, Video, Megaphone, FileText } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) redirect("/portal/dashboard");

  const [
    totalUsers, activeUsers, pendingUsers,
    totalCourses, activeCourses,
    totalVideos, totalDocs,
    totalAnnouncements, recentLogins,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true, role: { not: "PENDING_USER" } } }),
    prisma.user.count({ where: { role: "PENDING_USER" } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "ACTIVE" } }),
    prisma.video.count({ where: { status: "PUBLISHED" } }),
    prisma.libraryItem.count({ where: { status: "PUBLISHED" } }),
    prisma.announcement.count({ where: { published: true } }),
    prisma.auditLog.count({ where: { action: "ADMIN_LOGIN", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  const stats = [
    { label: "Tổng người dùng", value: totalUsers, sub: `${activeUsers} đang hoạt động`, icon: <Users className="w-5 h-5" />, color: "bg-navy/10 text-navy" },
    { label: "Chờ phê duyệt", value: pendingUsers, sub: "tài khoản mới", icon: <Users className="w-5 h-5" />, color: pendingUsers > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500" },
    { label: "Môn học", value: totalCourses, sub: `${activeCourses} đang học`, icon: <BookOpen className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-700" },
    { label: "Video bài giảng", value: totalVideos, sub: "đã xuất bản", icon: <Video className="w-5 h-5" />, color: "bg-red-100 text-red-600" },
    { label: "Tài liệu", value: totalDocs, sub: "đã xuất bản", icon: <FileText className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
    { label: "Thông báo", value: totalAnnouncements, sub: "đã đăng", icon: <Megaphone className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
          <BarChart2 className="w-5 h-5" /> Thống kê hệ thống
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Tổng quan hoạt động ULAW VB2-TX LMS</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                {s.icon}
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-dark tabular-nums">{s.value.toLocaleString("vi-VN")}</div>
            <div className="text-sm font-semibold text-slate-700 mt-1">{s.label}</div>
            <div className="text-xs text-slate-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      <div className="card p-6">
        <div className="section-title mb-4">Phân bổ vai trò người dùng</div>
        <RoleBreakdown />
      </div>
    </div>
  );
}

async function RoleBreakdown() {
  const roles = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
    orderBy: { _count: { role: "desc" } },
  });

  const ROLE_LABELS: Record<string, string> = {
    STUDENT: "Sinh viên", LECTURER: "Giảng viên", ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin", MODERATOR: "Moderator", CREATOR: "Creator", PENDING_USER: "Chờ duyệt",
  };

  const ROLE_COLORS: Record<string, string> = {
    STUDENT: "bg-navy", LECTURER: "bg-emerald-500", ADMIN: "bg-purple-500",
    SUPER_ADMIN: "bg-ulaw", MODERATOR: "bg-amber-500", CREATOR: "bg-blue-500", PENDING_USER: "bg-slate-300",
  };

  const total = roles.reduce((s, r) => s + r._count, 0);

  return (
    <div className="space-y-2">
      {roles.map(r => (
        <div key={r.role} className="flex items-center gap-3">
          <div className="text-xs font-medium text-slate-600 w-28 shrink-0">{ROLE_LABELS[r.role] ?? r.role}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${ROLE_COLORS[r.role] ?? "bg-slate-400"}`}
              style={{ width: `${(r._count / total) * 100}%` }}
            />
          </div>
          <div className="text-xs font-bold text-slate-700 w-8 text-right">{r._count}</div>
        </div>
      ))}
    </div>
  );
}
