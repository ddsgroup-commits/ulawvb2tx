import prisma from "./prisma";
import { AuditAction } from "@prisma/client";

export { AuditAction };

/**
 * Enhanced Audit Logging Utility
 * Supports various calling conventions found in the codebase.
 */
interface AuditParams {
  action: any;
  actorId?: string | null;
  userId?: string | null; // Alias for actorId
  targetId?: string | null;
  entity?: string | null;
  entityType?: string | null; // Alias for entity
  entityId?: string | null;
  detail?: any;
  newValue?: any;
  oldValue?: any;
  ipAddress?: string | null;
  req?: Request | null;
}

export async function logAudit(paramsOrReq: any, ...args: any[]) {
  try {
    let finalParams: any = {};

    if (paramsOrReq instanceof Request || (paramsOrReq && typeof paramsOrReq === 'object' && 'headers' in paramsOrReq)) {
      // Positional: logAudit(req, actorId, action, entity, entityId, detail)
      const [actorId, action, entity, entityId, detail] = args;
      finalParams = {
        action,
        actorId,
        entity,
        entityId,
        detail,
        ipAddress: getClientIp(paramsOrReq),
      };
    } else {
      // Object-based: logAudit({ ... })
      const p = paramsOrReq as AuditParams;
      finalParams = {
        action: p.action,
        actorId: p.actorId || p.userId,
        targetId: p.targetId,
        entity: p.entity || p.entityType,
        entityId: p.entityId,
        detail: p.detail || { ...(p.oldValue ? { oldValue: p.oldValue } : {}), ...(p.newValue ? { newValue: p.newValue } : {}) },
        ipAddress: p.ipAddress || (p.req ? getClientIp(p.req) : null),
      };
    }

    // Ensure action is a valid enum member, default to SYSTEM_SETTING_CHANGED if not
    const validActions = Object.values(AuditAction);
    if (!validActions.includes(finalParams.action)) {
      console.warn(`[audit] Invalid action "${finalParams.action}". Falling back to SYSTEM_SETTING_CHANGED.`);
      finalParams.action = AuditAction.SYSTEM_SETTING_CHANGED;
    }

    await prisma.auditLog.create({
      data: {
        action: finalParams.action as AuditAction,
        actorId: finalParams.actorId ?? null,
        targetId: finalParams.targetId ?? null,
        entity: finalParams.entity ?? null,
        entityId: finalParams.entityId ?? null,
        detail: finalParams.detail ?? undefined,
        ipAddress: finalParams.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] Failed to write audit log:", e);
  }
}

/** Extract IP from request headers */
export function getClientIp(req: Request): string | null {
  try {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}
