// =============================================================
// ULAW VB2 Portal — Role & Permission Matrix
//
// Single source of truth for "who can do what". API routes,
// middleware, server components, and admin UI should all read
// from this file rather than checking role strings inline.
//
// Role hierarchy (ascending power):
//   PENDING_USER → STUDENT → CREATOR → MODERATOR → LECTURER
//                                       → ADMIN → SUPER_ADMIN
// (LECTURER is a parallel branch for teaching staff and roughly
//  matches MODERATOR in content rights but with course ownership.)
// =============================================================

import { Role, ContentStatus } from "@prisma/client";
import { auth } from "./auth";

// ── Roles ────────────────────────────────────────────────────

/** Numeric power level — useful for "X or above" comparisons. */
export const ROLE_RANK: Record<Role, number> = {
  PENDING_USER: 0,
  STUDENT:      1,
  CREATOR:      2,
  LECTURER:     3,
  MODERATOR:    3,
  ADMIN:        4,
  SUPER_ADMIN:  5,
};

export const ROLE_LABELS: Record<Role, string> = {
  PENDING_USER: "Chờ duyệt",
  STUDENT:      "Sinh viên",
  CREATOR:      "Người tạo nội dung",
  LECTURER:     "Giảng viên",
  MODERATOR:    "Kiểm duyệt viên",
  ADMIN:        "Quản trị viên",
  SUPER_ADMIN:  "Chủ hệ thống",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  PENDING_USER: "Tài khoản mới — chờ admin duyệt",
  STUDENT:      "Xem nội dung đã duyệt, ghi chú cá nhân, lưu yêu thích",
  CREATOR:      "Tạo bản nháp nội dung và gửi duyệt",
  LECTURER:     "Giảng viên — quản lý môn học và bài giảng của mình",
  MODERATOR:    "Duyệt hoặc trả lại nội dung do CREATOR gửi lên",
  ADMIN:        "Quản lý người dùng, nội dung và cài đặt vận hành",
  SUPER_ADMIN:  "Toàn quyền — đặt vai trò, xoá tài khoản, đổi cấu hình hệ thống",
};

// ── Permission constants ─────────────────────────────────────

export const PERMISSIONS = {
  // User management
  USER_VIEW:            "user:view",
  USER_APPROVE:         "user:approve",
  USER_ROLE_CHANGE:     "user:role_change",
  USER_DEACTIVATE:      "user:deactivate",
  USER_DELETE:          "user:delete",

  // Content lifecycle
  CONTENT_CREATE_DRAFT: "content:create_draft",
  CONTENT_SUBMIT:       "content:submit",
  CONTENT_REVIEW:       "content:review",
  CONTENT_APPROVE:      "content:approve",
  CONTENT_PUBLISH:      "content:publish",
  CONTENT_EDIT_ANY:     "content:edit_any",
  CONTENT_EDIT_OWN:     "content:edit_own",
  CONTENT_DELETE:       "content:delete",
  CONTENT_PIN:          "content:pin",

  // Modules
  ANNOUNCEMENTS_MANAGE: "announcements:manage",
  VIDEOS_MANAGE:        "videos:manage",
  LIBRARY_MANAGE:       "library:manage",
  CALENDAR_MANAGE:      "calendar:manage",
  COURSES_MANAGE:       "courses:manage",

  // System
  SYSTEM_SETTINGS:      "system:settings",
  AUDIT_VIEW:           "audit:view",
  ANALYTICS_VIEW:       "analytics:view",
  BACKUP_EXPORT:        "system:backup_export",
  GOOGLE_INTEGRATION:   "system:google_integration",

  // Discussions / moderation
  DISCUSSION_MODERATE:  "discussion:moderate",
  TAG_MANAGE:           "tag:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Matrix: per-role permissions ─────────────────────────────
// Listed explicitly (no inheritance) so it's easy to audit a
// single line and know exactly what a role can do.

const STUDENT_PERMS: Permission[] = [];

const CREATOR_PERMS: Permission[] = [
  PERMISSIONS.CONTENT_CREATE_DRAFT,
  PERMISSIONS.CONTENT_SUBMIT,
  PERMISSIONS.CONTENT_EDIT_OWN,
];

const LECTURER_PERMS: Permission[] = [
  ...CREATOR_PERMS,
  PERMISSIONS.COURSES_MANAGE, // their own courses
  PERMISSIONS.CONTENT_PUBLISH, // for own courses
];

const MODERATOR_PERMS: Permission[] = [
  ...CREATOR_PERMS,
  PERMISSIONS.CONTENT_REVIEW,
  PERMISSIONS.CONTENT_APPROVE,
  PERMISSIONS.CONTENT_PIN,
  PERMISSIONS.DISCUSSION_MODERATE,
  PERMISSIONS.TAG_MANAGE,
];

const ADMIN_PERMS: Permission[] = [
  ...MODERATOR_PERMS,
  PERMISSIONS.USER_VIEW,
  PERMISSIONS.USER_APPROVE,
  PERMISSIONS.USER_ROLE_CHANGE,
  PERMISSIONS.USER_DEACTIVATE,
  PERMISSIONS.CONTENT_PUBLISH,
  PERMISSIONS.CONTENT_EDIT_ANY,
  PERMISSIONS.CONTENT_DELETE,
  PERMISSIONS.ANNOUNCEMENTS_MANAGE,
  PERMISSIONS.VIDEOS_MANAGE,
  PERMISSIONS.LIBRARY_MANAGE,
  PERMISSIONS.CALENDAR_MANAGE,
  PERMISSIONS.COURSES_MANAGE,
  PERMISSIONS.AUDIT_VIEW,
  PERMISSIONS.ANALYTICS_VIEW,
];

const SUPER_ADMIN_PERMS: Permission[] = [
  ...ADMIN_PERMS,
  PERMISSIONS.USER_DELETE,
  PERMISSIONS.SYSTEM_SETTINGS,
  PERMISSIONS.BACKUP_EXPORT,
  PERMISSIONS.GOOGLE_INTEGRATION,
];

export const ROLE_PERMISSIONS: Record<Role, ReadonlyArray<Permission>> = {
  PENDING_USER: [],
  STUDENT:      STUDENT_PERMS,
  CREATOR:      CREATOR_PERMS,
  LECTURER:     LECTURER_PERMS,
  MODERATOR:    MODERATOR_PERMS,
  ADMIN:        ADMIN_PERMS,
  SUPER_ADMIN:  SUPER_ADMIN_PERMS,
};

// ── Pure check functions (no DB / session) ───────────────────

export function isAtLeast(role: Role | string | undefined, minimum: Role): boolean {
  if (!role || !(role in ROLE_RANK)) return false;
  return ROLE_RANK[role as Role] >= ROLE_RANK[minimum];
}

export function hasPermission(role: Role | string | undefined, perm: Permission): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false;
  return ROLE_PERMISSIONS[role as Role].includes(perm);
}

export function isAdmin(role?: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isStaff(role?: string): boolean {
  // Anyone who can manage content in any capacity.
  return ["CREATOR", "LECTURER", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

export function canSeeAdminPanel(role?: string): boolean {
  return isAdmin(role);
}

export function canSeeModeratorPanel(role?: string): boolean {
  return ["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

export function canSeeCreatorPanel(role?: string): boolean {
  return ["CREATOR", "LECTURER", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

// ── User-management rules (with hierarchy) ───────────────────

/** Whether `actor` can change `target`'s role/status at all. */
export function canManageUser(
  actor: { role: Role; id: string } | null | undefined,
  target: { role: Role; id: string } | null | undefined,
): boolean {
  if (!actor || !target) return false;
  // Nobody can manage themselves through user-management UI (avoid self-lockout).
  if (actor.id === target.id) return false;
  // SUPER_ADMIN can manage anyone except other SUPER_ADMINs (only SUPER_ADMIN
  // can demote a SUPER_ADMIN — and only via an explicit confirmation flow).
  if (actor.role === "SUPER_ADMIN") return true;
  // ADMIN can manage anyone strictly below ADMIN.
  if (actor.role === "ADMIN") {
    return ROLE_RANK[target.role] < ROLE_RANK.ADMIN;
  }
  return false;
}

/** Whether `actor` can set `target`'s role to `nextRole`. */
export function canAssignRole(
  actor: { role: Role; id: string },
  target: { role: Role; id: string },
  nextRole: Role,
): boolean {
  if (!canManageUser(actor, target)) return false;
  // Only SUPER_ADMIN can grant SUPER_ADMIN.
  if (nextRole === "SUPER_ADMIN") return actor.role === "SUPER_ADMIN";
  // ADMIN cannot grant ADMIN (only SUPER_ADMIN can).
  if (nextRole === "ADMIN" && actor.role !== "SUPER_ADMIN") return false;
  return true;
}

// ── Content rules ────────────────────────────────────────────

interface ContentLike {
  authorId?: string | null;
  status?: ContentStatus | null;
}

export function canEditContent(
  actor: { role: Role; id: string } | null | undefined,
  content: ContentLike,
): boolean {
  if (!actor) return false;
  // Admins + super-admins can edit anything.
  if (actor.role === "ADMIN" || actor.role === "SUPER_ADMIN") return true;
  // Moderators can edit content currently under review.
  if (actor.role === "MODERATOR") {
    return content.status === "SUBMITTED" || content.status === "UNDER_REVIEW";
  }
  // Creators / lecturers can edit their own DRAFT or REJECTED content.
  if (actor.role === "CREATOR" || actor.role === "LECTURER") {
    if (content.authorId !== actor.id) return false;
    return content.status === "DRAFT" || content.status === "REJECTED";
  }
  return false;
}

export function canPublishContent(role?: string): boolean {
  return ["ADMIN", "SUPER_ADMIN", "LECTURER"].includes(role ?? "");
}

export function canApproveContent(role?: string): boolean {
  return ["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

export function canDeleteContent(role?: string): boolean {
  return ["ADMIN", "SUPER_ADMIN"].includes(role ?? "");
}

/** Visibility rule: should a student be able to see this content? */
export function isVisibleToStudent(content: ContentLike): boolean {
  return content.status === "PUBLISHED" || content.status === "APPROVED";
}

// ── Session-aware helpers (for server components / API routes) ──

export class PermissionError extends Error {
  constructor(public statusCode: 401 | 403, message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/** Returns the session or throws 401. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new PermissionError(401, "Chưa đăng nhập");
  return session;
}

/** Throws 401/403 unless the session user matches the role gate. */
export async function requireRole(...allowed: Role[]) {
  const session = await requireAuth();
  const role = session.user.role as Role;
  if (!allowed.includes(role)) {
    throw new PermissionError(403, "Không có quyền truy cập");
  }
  return session;
}

/** Throws unless the session user has the named permission. */
export async function requirePermission(perm: Permission) {
  const session = await requireAuth();
  if (!hasPermission(session.user.role as Role, perm)) {
    throw new PermissionError(403, "Không có quyền thực hiện thao tác này");
  }
  return session;
}

/** Throws unless the user has at least the given role level. */
export async function requireAtLeast(minimum: Role) {
  const session = await requireAuth();
  if (!isAtLeast(session.user.role as Role, minimum)) {
    throw new PermissionError(403, "Cần quyền cao hơn");
  }
  return session;
}
