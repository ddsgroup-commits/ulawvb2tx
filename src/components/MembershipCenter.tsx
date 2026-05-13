// =============================================================
// MembershipCenter — role-aware "what can I do here" card
//
// Server component. Drops onto any page (typically the portal
// dashboard) and renders a personalised panel for the logged-in
// user based on their `Role`. Used as the single anchor for
// each member's "personal control center" — the actions visible
// shrink/grow depending on the user's level.
// =============================================================

import Link from "next/link";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  isAdmin,
  canSeeCreatorPanel,
  canSeeModeratorPanel,
} from "@/lib/permissions";
import {
  ShieldCheck,
  Crown,
  PenSquare,
  Gavel,
  GraduationCap,
  UserCheck,
  Clock,
  ArrowRight,
  Settings2,
  Users,
  FileText,
  ListChecks,
  BookOpen,
  Activity,
} from "lucide-react";

interface Props {
  userId: string;
  role: Role;
  /** Show extra "drafts pending" / "approvals waiting" badges. Costs 1-2 DB calls. */
  withBadges?: boolean;
}

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: number;
  accent?: "navy" | "ulaw" | "amber" | "emerald" | "purple";
}

const ROLE_ICON: Record<Role, React.ElementType> = {
  SUPER_ADMIN:  Crown,
  ADMIN:        ShieldCheck,
  MODERATOR:    Gavel,
  LECTURER:     GraduationCap,
  CREATOR:      PenSquare,
  STUDENT:      UserCheck,
  PENDING_USER: Clock,
};

const ROLE_ACCENT: Record<Role, string> = {
  SUPER_ADMIN:  "from-rose-500 to-red-600 text-white",
  ADMIN:        "from-navy to-navy-light text-white",
  MODERATOR:    "from-amber-500 to-orange-600 text-white",
  LECTURER:     "from-purple-500 to-indigo-600 text-white",
  CREATOR:      "from-emerald-500 to-teal-600 text-white",
  STUDENT:      "from-sky-500 to-blue-600 text-white",
  PENDING_USER: "from-slate-400 to-slate-500 text-white",
};

export default async function MembershipCenter({ userId, role, withBadges = true }: Props) {
  const RoleIcon = ROLE_ICON[role] ?? UserCheck;

  // Counts that influence quick-action badges. Skipped for PENDING_USER
  // since they can't act on anything.
  const [myDraftsCount, pendingApprovalsCount, pendingUserCount] = await Promise.all([
    withBadges && (role === "CREATOR" || role === "LECTURER")
      ? prisma.announcement.count({ where: { authorId: userId, status: { in: ["DRAFT", "REJECTED"] } } }).catch(() => 0)
      : Promise.resolve(0),
    withBadges && (role === "MODERATOR" || role === "ADMIN" || role === "SUPER_ADMIN")
      ? prisma.announcement.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }).catch(() => 0)
      : Promise.resolve(0),
    withBadges && (role === "ADMIN" || role === "SUPER_ADMIN")
      ? prisma.user.count({ where: { role: "PENDING_USER" } }).catch(() => 0)
      : Promise.resolve(0),
  ]);

  const actions = buildQuickActions(role, {
    myDraftsCount,
    pendingApprovalsCount,
    pendingUserCount,
  });

  const permissionCount = ROLE_PERMISSIONS[role]?.length ?? 0;

  return (
    <section
      className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm"
      aria-label="Trung tâm thành viên"
    >
      {/* Banner ───────────────────────────────────────────────── */}
      <div className={`px-5 py-4 md:px-6 md:py-5 bg-gradient-to-br ${ROLE_ACCENT[role]} relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <RoleIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider opacity-75 font-semibold">
              Cấp thành viên · Level {ROLE_RANK[role]}/5
            </div>
            <h2 className="text-lg font-extrabold mt-0.5">
              {ROLE_LABELS[role]}
            </h2>
            <p className="text-sm opacity-85 mt-0.5">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
          <Link
            href="/portal/profile"
            className="hidden md:inline-flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Hồ sơ <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* PENDING_USER short-circuit ──────────────────────────── */}
      {role === "PENDING_USER" ? (
        <div className="p-5 md:p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm leading-relaxed">
            Tài khoản của bạn đang chờ Ban cán sự duyệt. Khi được duyệt, bạn sẽ
            có quyền truy cập đầy đủ vào portal — bài giảng, video, thư viện
            và lịch học.
          </div>
        </div>
      ) : (
        <>
          {/* Quick actions ───────────────────────────────────── */}
          {actions.length > 0 && (
            <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {actions.map((a) => (
                <ActionTile key={a.href} action={a} />
              ))}
            </div>
          )}

          {/* Stats strip ──────────────────────────────────────── */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-slate-600">
              <span>
                <strong className="text-navy">{permissionCount}</strong> quyền
              </span>
              {isAdmin(role) && (
                <span>
                  <strong className="text-navy">{pendingUserCount}</strong> chờ duyệt
                </span>
              )}
              {(role === "MODERATOR" || isAdmin(role)) && (
                <span>
                  <strong className="text-amber-600">{pendingApprovalsCount}</strong> nội dung chờ
                </span>
              )}
            </div>
            <Link
              href="/portal/profile#permissions"
              className="text-navy font-medium hover:underline"
            >
              Xem quyền chi tiết →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────

interface BadgeCounts {
  myDraftsCount: number;
  pendingApprovalsCount: number;
  pendingUserCount: number;
}

function buildQuickActions(role: Role, c: BadgeCounts): QuickAction[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        { href: "/admin/users",       label: "Quản lý người dùng",    description: "Đặt vai trò, duyệt thành viên mới", icon: Users,       accent: "navy",   badge: c.pendingUserCount },
        { href: "/moderator",         label: "Duyệt nội dung",        description: "Hàng chờ xét duyệt",                  icon: ListChecks,  accent: "amber",  badge: c.pendingApprovalsCount },
        { href: "/admin/announcements", label: "Quản lý thông báo",    description: "Tạo và xuất bản nội dung",            icon: FileText,    accent: "navy" },
        { href: "/admin/audit",       label: "Nhật ký hoạt động",     description: "Audit log toàn hệ thống",             icon: Activity,    accent: "purple" },
        { href: "/admin/settings",    label: "Cấu hình hệ thống",     description: "Backup, Google, các chuyển đổi",       icon: Settings2,   accent: "navy" },
      ];

    case "ADMIN":
      return [
        { href: "/admin/users",       label: "Quản lý người dùng",   description: "Duyệt PENDING, đặt vai trò",          icon: Users,      accent: "navy",   badge: c.pendingUserCount },
        { href: "/moderator",         label: "Duyệt nội dung",       description: "Hàng chờ xét duyệt",                   icon: ListChecks, accent: "amber",  badge: c.pendingApprovalsCount },
        { href: "/admin/announcements", label: "Quản lý thông báo",  description: "Đăng tin nhanh cho toàn lớp",          icon: FileText,   accent: "navy" },
        { href: "/admin/videos",      label: "Quản lý video",        description: "Thư viện video YouTube + Drive",       icon: BookOpen,   accent: "ulaw" },
        { href: "/admin/library",     label: "Quản lý thư viện",     description: "Tài liệu, lecture notes, đề thi",      icon: FileText,   accent: "emerald" },
        { href: "/admin/audit",       label: "Nhật ký hoạt động",    description: "Theo dõi thao tác admin",              icon: Activity,   accent: "purple" },
      ];

    case "MODERATOR":
      return [
        { href: "/moderator", label: "Hàng chờ duyệt",      description: "Duyệt nội dung do CREATOR gửi",       icon: ListChecks, accent: "amber",   badge: c.pendingApprovalsCount },
        { href: "/creator",   label: "Studio cá nhân",       description: "Bản nháp của tôi",                     icon: PenSquare,  accent: "emerald", badge: c.myDraftsCount },
      ];

    case "LECTURER":
      return [
        { href: "/creator",        label: "Tạo bài giảng",      description: "Bản nháp video / tài liệu / thông báo", icon: PenSquare,  accent: "emerald", badge: c.myDraftsCount },
        { href: "/portal/courses", label: "Môn của tôi",         description: "Lớp đang giảng dạy",                   icon: BookOpen,   accent: "purple" },
      ];

    case "CREATOR":
      return [
        { href: "/creator",  label: "Studio nội dung",          description: "Tạo bản nháp + gửi duyệt",            icon: PenSquare, accent: "emerald", badge: c.myDraftsCount },
        { href: "/creator?new=announcement", label: "Tạo thông báo", description: "Soạn tin gửi duyệt",              icon: FileText,  accent: "navy" },
      ];

    case "STUDENT":
      return [
        { href: "/portal/courses",       label: "Môn học của tôi",    description: "Theo dõi tiến độ và bài giảng", icon: BookOpen, accent: "navy" },
        { href: "/portal/videos",        label: "Video bài giảng",    description: "Xem lại buổi học",              icon: BookOpen, accent: "ulaw" },
        { href: "/portal/library",       label: "Thư viện tài liệu",  description: "Tải đề thi, giáo trình",        icon: FileText, accent: "emerald" },
        { href: "/portal/announcements", label: "Thông báo",         description: "Cập nhật mới nhất từ lớp",        icon: ListChecks, accent: "purple" },
      ];

    default:
      return [];
  }
}

function ActionTile({ action }: { action: QuickAction }) {
  const accentMap: Record<NonNullable<QuickAction["accent"]>, string> = {
    navy:    "bg-navy/10 text-navy",
    ulaw:    "bg-ulaw/10 text-ulaw",
    amber:   "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    purple:  "bg-purple-50 text-purple-700",
  };
  const accent = accentMap[action.accent ?? "navy"];
  const Icon = action.icon;
  const hasBadge = (action.badge ?? 0) > 0;

  return (
    <Link
      href={action.href}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 hover:border-navy/30 hover:shadow-sm transition-all"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-slate-800 text-sm leading-tight truncate">
            {action.label}
          </div>
          {hasBadge && (
            <span className="text-[10px] font-bold bg-ulaw text-white rounded-full px-1.5 py-0.5">
              {action.badge}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
          {action.description}
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-navy mt-1 shrink-0" />
    </Link>
  );
}

// ── Quick visibility helpers (re-exported for the layout) ────
export { canSeeCreatorPanel, canSeeModeratorPanel };
