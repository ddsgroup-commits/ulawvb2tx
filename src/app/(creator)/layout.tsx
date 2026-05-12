import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PenSquare, Film, FileText, Send, ArrowLeft,
  LayoutDashboard, ClipboardList,
} from "lucide-react";
import { canAccessCreatorStudio } from "@/lib/rbac";
import type { Role } from "@prisma/client";

const CREATOR_NAV = [
  { href: "/creator",          label: "Tổng quan",        icon: LayoutDashboard },
  { href: "/creator/drafts",   label: "Nháp của tôi",     icon: ClipboardList },
  { href: "/creator/new/announcement", label: "Viết thông báo", icon: PenSquare },
  { href: "/creator/new/video",        label: "Thêm video",     icon: Film },
  { href: "/creator/new/document",     label: "Thêm tài liệu",  icon: FileText },
];

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  if (!canAccessCreatorStudio(role)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Creator sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-slate-100 sticky top-0 min-h-screen py-6 px-3">
        <div className="px-3 mb-6">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-navy" />
            <span className="font-bold text-navy text-sm">Creator Studio</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ULAW VB2 Portal</p>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {CREATOR_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 text-sm
                         font-medium hover:bg-navy/5 hover:text-navy transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-400
                     text-sm hover:text-navy hover:bg-navy/5 transition-colors mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Cổng thông tin
        </Link>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 h-14 flex items-center gap-4">
          <Send className="w-4 h-4 text-navy" />
          <span className="font-semibold text-navy text-sm">Creator Studio</span>
          <div className="flex-1" />
          <Link href="/dashboard" className="btn-outline btn btn-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Portal
          </Link>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
