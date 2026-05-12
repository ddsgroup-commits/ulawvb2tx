import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Megaphone, CalendarDays, BookOpen,
  Library, Users, HelpCircle, Settings, ArrowLeft, ShieldCheck,
  MailPlus, Activity, Film, GraduationCap, Settings2,
  ClipboardCheck, UserCheck, Server,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { canAccessAdmin, hasMinRole } from "@/lib/rbac";

interface NavItem {
  href:     string;
  label:    string;
  icon:     React.ElementType;
  minRole?: Role;
}

const ADMIN_NAV: NavItem[] = [
  { href: "/admin",               label: "Dashboard",        icon: LayoutDashboard },
  { href: "/admin/control-panel", label: "Control Panel",    icon: Settings2,      minRole: "SUPER_ADMIN" },
  { href: "/admin/announcements", label: "Thông báo",        icon: Megaphone,      minRole: "MODERATOR" },
  { href: "/admin/approvals",     label: "Duyệt nội dung",   icon: ClipboardCheck, minRole: "MODERATOR" },
  { href: "/admin/events",        label: "Sự kiện / Lịch",   icon: CalendarDays,   minRole: "ADMIN" },
  { href: "/admin/courses",       label: "Môn học",          icon: BookOpen,       minRole: "ADMIN" },
  { href: "/admin/lessons",       label: "Bài học (LMS)",    icon: GraduationCap,  minRole: "ADMIN" },
  { href: "/admin/videos",        label: "Video bài giảng",  icon: Film,           minRole: "ADMIN" },
  { href: "/admin/library",       label: "Thư viện",         icon: Library,        minRole: "ADMIN" },
  { href: "/admin/users",         label: "Người dùng",       icon: Users,          minRole: "ADMIN" },
  { href: "/admin/invitations",   label: "Lời mời",          icon: MailPlus,       minRole: "ADMIN" },
  { href: "/admin/faq",           label: "FAQ",              icon: HelpCircle,     minRole: "ADMIN" },
  { href: "/admin/audit",         label: "Nhật ký",          icon: Activity,       minRole: "ADMIN" },
  { href: "/admin/system",        label: "Hệ thống",         icon: Server,         minRole: "SUPER_ADMIN" },
  { href: "/admin/settings",      label: "Cài đặt hệ thống", icon: Settings,       minRole: "SUPER_ADMIN" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  // PENDING_USER and STUDENT cannot access admin panel
  if (!canAccessAdmin(role)) redirect("/dashboard");

  // Filter nav items by role
  const visibleNav = ADMIN_NAV.filter(
    (item) => !item.minRole || hasMinRole(role, item.minRole)
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Admin sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-navy-dark text-white sticky top-0 min-h-screen py-6 px-3">
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 mb-8">
          <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
          <div>
            <div className="text-xs font-bold text-white leading-tight">ULAW VB2</div>
            <div className="text-[10px] text-white/50">Admin Panel</div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-[10px] text-white/70">
            <UserCheck className="w-3 h-3" />
            {role === "SUPER_ADMIN" ? "Quản trị cao nhất"
              : role === "ADMIN"     ? "Quản trị viên"
              : role === "MODERATOR" ? "Kiểm duyệt viên"
              : role}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/70 text-sm
                         font-medium hover:bg-white/10 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Back to portal */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/60
                     text-sm hover:text-white hover:bg-white/10 transition-colors mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Cổng thông tin
        </Link>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 h-14 flex items-center gap-4 shadow-nav">
          <ShieldCheck className="w-5 h-5 text-navy" />
          <span className="font-semibold text-navy text-sm">Bảng quản trị</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">ULAW VB2 Portal</span>
          <div className="flex-1" />
          <Link href="/dashboard" className="btn-outline btn btn-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Cổng thông tin
          </Link>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
