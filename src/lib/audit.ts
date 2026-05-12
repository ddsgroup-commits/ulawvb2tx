import prisma from "./prisma";
import { AuditAction } from "@prisma/client";

interface AuditParams {
  action: AuditAction;
  actorId?: string | null;
  targetId?: string | null;
  entity?: string | null;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId ?? null,
        targetId: params.targetId ?? null,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        detail: params.detail ?? undefined,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (e) {
    // Audit logging should never crash the main request
    console.error("[audit] Failed to write audit log:", e);
  }
}

/** Extract IP from request headers */
export function getClientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}
