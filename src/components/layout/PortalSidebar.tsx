"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, Megaphone, Calendar, Video,
  Library, Users, Settings, LogOut, Shield, Edit3, User,
  BarChart2, ClipboardList, MessageSquare, HelpCircle
} from "lucide-react";

type Role = "SUPER_ADMIN"|"ADMIN"|"MODERATOR"|"CREATOR"|"LECTURER"|"STUDENT"|"PENDING_USER";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  roles?: Role[];
}

function getNavSections(role: Role): NavSection[] {
  const portal: NavSection = {
    title: "Portal học tập",
    items: [
      { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard", href: "/portal/dashboard" },
      { icon: <BookOpen className="w-4 h-4" />, label: "Môn học", href: "/portal/courses" },
      { icon: <Megaphone className="w-4 h-4" />, label: "Thông báo", href: "/portal/announcements" },
      { icon: <Calendar className="w-4 h-4" />, label: "Lịch học", href: "/portal/calendar" },
      { icon: <Video className="w-4 h-4" />, label: "Video bài giảng", href: "/portal/videos" },
      { icon: <Library className="w-4 h-4" />, label: "Thư viện tài liệu", href: "/portal/library" },
      { icon: <Users className="w-4 h-4" />, label: "Danh bạ lớp", href: "/portal/classmates" },
      { icon: <MessageSquare className="w-4 h-4" />, label: "Thảo luận", href: "/portal/discussions" },
      { icon: <HelpCircle className="w-4 h-4" />, label: "FAQ", href: "/portal/faq" },
    ],
  };

  const creator: NavSection = {
    title: "Creator Studio",
    roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"],
    items: [
      { icon: <Edit3 className="w-4 h-4" />, label: "Bản nháp của tôi", href: "/creator" },
    ],
  };

  const moderator: NavSection = {
    title: "Kiểm duyệt",
    roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
    items: [
      { icon: <ClipboardList className="w-4 h-4" />, label: "Hàng đợi duyệt", href: "/moderator" },
    ],
  };

  const admin: NavSection = {
    title: "Quản lý",
    roles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      { icon: <Users className="w-4 h-4" />, label: "Người dùng", href: "/admin/users" },
      { icon: <Megaphone className="w-4 h-4" />, label: "Thông báo (Admin)", href: "/admin/announcements" },
      { icon: <BookOpen className="w-4 h-4" />, label: "Môn học (Admin)", href: "/admin/courses" },
      { icon: <Video className="w-4 h-4" />, label: "Video (Admin)", href: "/admin/videos" },
      { icon: <BarChart2 className="w-4 h-4" />, label: "Thống kê", href: "/admin/analytics" },
      { icon: <Shield className="w-4 h-4" />, label: "Audit Logs", href: "/admin/audit" },
      { icon: <Settings className="w-4 h-4" />, label: "Cài đặt hệ thống", href: "/admin/settings" },
    ],
  };

  const sections = [portal, creator, moderator, admin];
  return sections.filter(s => !s.roles || s.roles.includes(role));
}

export function PortalSidebar({ role = "STUDENT", userName = "", pendingCount = 0 }: {
  role?: Role;
  userName?: string;
  pendingCount?: number;
}) {
  const pathname = usePathname();
  const sections = getNavSections(role);
  const initials = (userName || "U").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

  const ROLE_LABELS: Record<Role, string> = {
    SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
    CREATOR: "Creator", LECTURER: "Giảng viên", STUDENT: "Sinh viên", PENDING_USER: "Chờ duyệt",
  };

  return (
    <aside className="portal-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">UL</div>
        <div>
          <div className="font-bold text-navy text-sm leading-tight">ULAW VB2-TX</div>
          <div className="text-[10px] text-slate-400 leading-tight">LMS Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <div key={si} className="sidebar-section">
            {section.title && (
              <div className="sidebar-section-label">{section.title}</div>
            )}
            {section.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}>
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/admin/users" && pendingCount > 0 && (
                    <span className="badge-count">{pendingCount}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <Link href="/portal/profile"
          className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
          <div className="avatar-sm bg-navy text-white shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-700 truncate">{userName || "Sinh viên"}</div>
            <div className="text-[10px] text-slate-400">{ROLE_LABELS[role]}</div>
          </div>
          <User className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-medium mt-1">
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
