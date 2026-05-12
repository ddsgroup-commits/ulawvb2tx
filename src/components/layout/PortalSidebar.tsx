"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Megaphone, CalendarDays, BookOpen,
  Library, Users, HelpCircle, LogOut, ShieldCheck, GraduationCap, Brain, Film, Sparkles, Send,
} from "lucide-react";

interface NavItem {
  href:      string;
  label:     string;
  icon:      React.ElementType;
  highlight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",     label: "Bảng điều khiển",     icon: LayoutDashboard },
  { href: "/my-learning",   label: "Học tập của tôi",      icon: Sparkles, highlight: true },
  { href: "/announcements", label: "Thông báo",            icon: Megaphone },
  { href: "/schedule",      label: "Lịch học & Deadline",  icon: CalendarDays },
  { href: "/courses",       label: "Môn học",              icon: BookOpen },
  { href: "/videos",        label: "Video bài giảng",      icon: Film },
  { href: "/library",       label: "Thư viện",             icon: Library },
  { href: "/ai-hub",        label: "AI Study Hub",         icon: Brain },
  { href: "/contacts",      label: "Danh bạ lớp",          icon: Users },
  { href: "/faq",           label: "FAQ & Hướng dẫn",      icon: HelpCircle },
];

interface PortalSidebarProps {
  /** Subset of NAV_ITEMS hrefs to show. null = show all (admin view). */
  enabledPaths?: string[] | null;
}

export function PortalSidebar({ enabledPaths }: PortalSidebarProps = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "STUDENT";
  const isAdmin     = ["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(role);
  const isCreator   = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR"].includes(role);

  // When enabledPaths is provided, gate items to only those.
  const visibleItems = enabledPaths
    ? NAV_ITEMS.filter((item) => enabledPaths.includes(item.href))
    : NAV_ITEMS;

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-100 min-h-screen sticky top-0 py-6 px-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shrink-0">
          <span className="text-white font-extrabold text-sm">UL</span>
        </div>
        <div>
          <div className="text-xs font-bold text-navy leading-tight">ULAW VB2</div>
          <div className="text-[10px] text-slate-500">Cổng thông tin lớp</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {visibleItems.map(({ href, label, icon: Icon, highlight }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "sidebar-link",
              pathname.startsWith(href) && "active",
              highlight && !pathname.startsWith(href) &&
                "text-amber-700 hover:bg-amber-50 hover:text-amber-800",
              highlight && pathname.startsWith(href) &&
                "!bg-amber-50 !text-amber-800",
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", highlight && "text-amber-600")} />
            {label}
            {highlight && (
              <span className="ml-auto text-[9px] bg-gold text-white font-bold px-1.5 py-0.5 rounded-full">
                AI
              </span>
            )}
          </Link>
        ))}

        {(isAdmin || isCreator) && (
          <div className="border-t border-slate-100 my-2" />
        )}
        {isCreator && (
          <Link
            href="/creator"
            className={cn("sidebar-link", pathname.startsWith("/creator") && "active")}
          >
            <Send className="w-4 h-4 shrink-0" />
            Creator Studio
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn("sidebar-link", pathname.startsWith("/admin") && "active")}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Quản trị hệ thống
          </Link>
        )}
      </nav>

      {/* User profile */}
      {session?.user && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
              {session.user.image ? (
                <img src={session.user.image} className="w-8 h-8 rounded-full" alt="" />
              ) : (
                <GraduationCap className="w-4 h-4 text-navy" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {session.user.name ?? "Thành viên"}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {session.user.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="sidebar-link w-full mt-1 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      )}
    </aside>
  );
}
