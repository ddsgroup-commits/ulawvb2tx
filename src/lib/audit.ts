/**
 * Audit log helper.
 * Every sensitive action in the system must call logAudit.
 *
 * Logged actions:
 *   ROLE_CHANGED, USER_APPROVED, USER_REJECTED, USER_DEACTIVATED,
 *   USER_ACTIVATED, USER_DELETED, USER_CREATED,
 *   CONTENT_SUBMITTED, CONTENT_APPROVED, CONTENT_REJECTED,
 *   CONTENT_PUBLISHED, CONTENT_DELETED,
 *   ADMIN_LOGIN, CALENDAR_SYNC, VIDEO_CHANGED, DOCUMENT_CHANGED,
 *   SETTINGS_CHANGED
 */

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";

interface AuditParams {
  req:        NextRequest | null;
  userId:     string;
  actorRole?: Role | string;
  action:     string;
  entityType: string;
  entityId?:  string | null;
  oldValue?:  Record<string, unknown> | null;
  newValue?:  Record<string, unknown> | null;
  meta?:      Record<string, unknown>;
}

export async function logAudit({
  req,
  userId,
  actorRole,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  meta,
}: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        actorRole: actorRole ?? null,
        action,
        entityType,
        entityId:  entityId  ?? null,
        oldValue:  (oldValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newValue:  (newValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        meta:      (meta     as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ip:        req?.headers.get("x-forwarded-for") ?? req?.headers.get("x-real-ip") ?? null,
        userAgent: req?.headers.get("user-agent") ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to write log:", err);
  }
}

// ── Action constants ──────────────────────────────────────────

export const AuditAction = {
  // User management
  USER_CREATED:      "USER_CREATED",
  USER_APPROVED:     "USER_APPROVED",
  USER_REJECTED:     "USER_REJECTED",
  USER_DELETED:      "USER_DELETED",
  USER_ACTIVATED:    "USER_ACTIVATED",
  USER_DEACTIVATED:  "USER_DEACTIVATED",
  ROLE_CHANGED:      "ROLE_CHANGED",

  // Auth
  ADMIN_LOGIN:       "ADMIN_LOGIN",

  // Content lifecycle
  CONTENT_CREATED:   "CONTENT_CREATED",
  CONTENT_SUBMITTED: "CONTENT_SUBMITTED",
  CONTENT_APPROVED:  "CONTENT_APPROVED",
  CONTENT_REJECTED:  "CONTENT_REJECTED",
  CONTENT_PUBLISHED: "CONTENT_PUBLISHED",
  CONTENT_DELETED:   "CONTENT_DELETED",
  CONTENT_ARCHIVED:  "CONTENT_ARCHIVED",

  // Specific content types
  VIDEO_CHANGED:     "VIDEO_CHANGED",
  DOCUMENT_CHANGED:  "DOCUMENT_CHANGED",

  // System
  SETTINGS_CHANGED:  "SETTINGS_CHANGED",
  CALENDAR_SYNC:     "CALENDAR_SYNC",
} as const;
