"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Bell, GraduationCap, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-learning", label: "Học tập" },
  { href: "/announcements", label: "Thông báo" },
  { href: "/schedule", label: "Lịch học" },
  { href: "/courses", label: "Môn học" },
  { href: "/videos", label: "Video" },
  { href: "/library", label: "Thư viện" },
  { href: "/contacts", label: "Danh bạ" },
  { href: "/faq", label: "FAQ" },
];

interface PortalTopbarProps {
  enabledPaths?: string[] | null;
}

export function PortalTopbar({ enabledPaths }: PortalTopbarProps = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

  const visibleItems = enabledPaths
    ? NAV_ITEMS.filter((item) => enabledPaths.includes(item.href))
    : NAV_ITEMS;

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-100 shadow-nav">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center">
            <span className="text-white font-extrabold text-xs">UL</span>
          </div>
          <span className="text-sm font-bold text-navy">ULAW VB2</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop nav scroll */}
        <nav className="hidden sm:flex gap-1 overflow-x-auto">
          {visibleItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                pathname.startsWith(href)
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        {isAdmin && (
          <Link href="/admin" className="p-2 rounded-lg hover:bg-slate-100">
            <ShieldCheck className="w-4 h-4 text-navy" />
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
