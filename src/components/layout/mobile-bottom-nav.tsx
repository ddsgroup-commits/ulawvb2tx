"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Calendar, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile-only bottom nav (md:hidden). Five primary destinations students
 * use multiple times per day — matches the app-like feel called for in
 * the master spec ("Mobile bottom navigation for students").
 */
const ITEMS = [
  { href: "/portal/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/portal/courses", label: "Môn học", icon: BookOpen },
  { href: "/portal/calendar", label: "Lịch", icon: Calendar },
  { href: "/portal/ai-assistant", label: "AI", icon: Sparkles },
  { href: "/portal/profile", label: "Hồ sơ", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      {ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn(active && "active")}>
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
