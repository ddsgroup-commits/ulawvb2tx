"use client";

import { Bell, Search, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PortalTopbarProps {
  userName?: string;
  pageTitle?: string;
  onMenuClick?: () => void;
  notificationCount?: number;
}

export function PortalTopbar({
  userName = "",
  pageTitle = "",
  onMenuClick,
  notificationCount = 0,
}: PortalTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="portal-topbar">
      {/* Left: menu button (mobile) + page title */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
        )}
        {pageTitle && (
          <span className="text-sm font-semibold text-slate-600 hidden sm:block truncate max-w-[200px]">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right: search + bell + greeting */}
      <div className="flex items-center gap-2">
        {/* Search toggle */}
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Tìm kiếm..."
              onBlur={() => setSearchOpen(false)}
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 w-48"
            />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <Link href="/portal/announcements"
          className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-ulaw text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* Greeting */}
        {userName && (
          <Link href="/portal/profile"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <span className="text-xs text-slate-500">Xin chào,</span>
            <span className="text-xs font-semibold text-navy truncate max-w-[120px]">
              {userName.split(" ").slice(-1)[0]}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
