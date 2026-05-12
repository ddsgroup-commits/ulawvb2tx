/**
 * RBAC — Role-Based Access Control
 *
 * Role hierarchy (highest → lowest):
 *   SUPER_ADMIN > ADMIN > MODERATOR > CREATOR > STUDENT > PENDING_USER
 *
 * Import the typed helpers below instead of hand-rolling role checks in routes.
 */

import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// ── Role hierarchy ────────────────────────────────────────────

const ROLE_RANK: Record<Role, number> = {
  SUPER_ADMIN:  100,
  ADMIN:         80,
  MODERATOR:     60,
  CREATOR:       40,
  STUDENT:       20,
  PENDING_USER:   0,
};

export function roleRank(role: Role): number {
  return ROLE_RANK[role] ?? 0;
}

/** True if `actor` has at least the same rank as `minimum`. */
export function hasMinRole(actor: Role, minimum: Role): boolean {
  return ROLE_RANK[actor] >= ROLE_RANK[minimum];
}

// ── Capability checks ─────────────────────────────────────────

/** Can this role access the admin panel at all? */
export function canAccessAdmin(role: Role): boolean {
  return hasMinRole(role, "MODERATOR");
}

/** Can this role manage (create/edit/delete) other users? */
export function canManageUsers(role: Role): boolean {
  return hasMinRole(role, "ADMIN");
}

/** Can actor manage target user — prevents lower ranks from touching higher ranks. */
export function canManageUser(actorRole: Role, targetRole: Role): boolean {
  if (!canManageUsers(actorRole)) return false;
  // Only SUPER_ADMIN can manage another SUPER_ADMIN
  if (targetRole === "SUPER_ADMIN") return actorRole === "SUPER_ADMIN";
  return true;
}

/** Can actor change target's role? Also validates the new role is reachable. */
export function canChangeRole(actorRole: Role, targetCurrentRole: Role, newRole: Role): boolean {
  if (!canManageUser(actorRole, targetCurrentRole)) return false;
  // Can only assign roles up to (but not above) your own rank
  if (ROLE_RANK[newRole] > ROLE_RANK[actorRole]) return false;
  // ADMIN cannot create SUPER_ADMIN
  if (actorRole === "ADMIN" && newRole === "SUPER_ADMIN") return false;
  return true;
}

/** Can this role approve/reject pending user registrations? */
export function canApproveUsers(role: Role): boolean {
  return hasMinRole(role, "ADMIN");
}

/** Can this role publish content directly (skip approval)? */
export function canPublishDirectly(role: Role): boolean {
  return hasMinRole(role, "ADMIN");
}

/** Can this role approve content submitted by others? */
export function canApproveContent(role: Role): boolean {
  return hasMinRole(role, "MODERATOR");
}

/** Can this role create draft content? */
export function canCreateContent(role: Role): boolean {
  return hasMinRole(role, "CREATOR");
}

/** Can this role submit their own draft for review? */
export function canSubmitContent(role: Role): boolean {
  return hasMinRole(role, "CREATOR");
}

/**
 * Can this user edit a specific piece of content?
 * Rules:
 *  - SUPER_ADMIN: everything
 *  - ADMIN: all non-system content
 *  - MODERATOR: submitted/approved content before it's published
 *  - CREATOR: only their own DRAFT or REJECTED content
 *  - STUDENT/PENDING_USER: nothing
 */
export function canEditContent(
  actorRole: Role,
  actorId: string,
  authorId: string,
  contentStatus: string,
): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "ADMIN") return true;
  if (actorRole === "MODERATOR") return ["SUBMITTED", "APPROVED"].includes(contentStatus);
  if (actorRole === "CREATOR") {
    return actorId === authorId && ["DRAFT", "REJECTED"].includes(contentStatus);
  }
  return false;
}

/** Can this role delete published content? */
export function canDeleteContent(role: Role): boolean {
  return hasMinRole(role, "ADMIN");
}

/** Can this role view audit logs? */
export function canViewAuditLogs(role: Role): boolean {
  return hasMinRole(role, "ADMIN");
}

/** Can this role manage system settings? */
export function canManageSettings(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

/** Can this role access the Creator Studio? */
export function canAccessCreatorStudio(role: Role): boolean {
  return hasMinRole(role, "CREATOR");
}

// ── Route guard helpers ───────────────────────────────────────

type AuthGuardResult =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof auth>>>; userId: string; role: Role }
  | { ok: false; response: NextResponse };

/**
 * Call at the top of any API route handler that needs authentication.
 * Returns session on success or a ready-to-return 401 response.
 */
export async function requireAuth(): Promise<AuthGuardResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 }),
    };
  }
  return {
    ok: true,
    session,
    userId: session.user.id,
    role: session.user.role as Role,
  };
}

/**
 * Requires authentication AND at least `minRole`.
 */
export async function requireRole(minRole: Role): Promise<AuthGuardResult> {
  const guard = await requireAuth();
  if (!guard.ok) return guard;
  if (!hasMinRole(guard.role, minRole)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Không đủ quyền truy cập" }, { status: 403 }),
    };
  }
  return guard;
}

/**
 * Check a boolean permission; return 403 if denied.
 * Use after `requireAuth()` to layer on custom checks.
 */
export function requirePermission(allowed: boolean): NextResponse | null {
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Không có quyền thực hiện thao tác này" }, { status: 403 });
  }
  return null;
}
