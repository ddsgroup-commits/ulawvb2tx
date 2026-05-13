/**
 * apiHandler — uniform wrapper for all `/api/*` route handlers.
 *
 * Centralizes auth, role/permission checks, Zod body/query parsing,
 * and error → JSON conversion so individual route files stay small.
 *
 * Usage:
 *
 *   export const POST = apiHandler({
 *     auth: "required",
 *     permission: "announcements:manage",
 *     body: AnnouncementCreateSchema,
 *     handler: async ({ session, body }) => {
 *       const item = await prisma.announcement.create({ data: body });
 *       return ok(item, 201);
 *     },
 *   });
 */
import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { Role } from "@prisma/client";
import { auth } from "./auth";
import {
  PermissionError,
  hasPermission,
  isAtLeast,
  type Permission,
} from "./permissions";

export interface ApiContext<Body, Query, Params> {
  req: NextRequest;
  session: Awaited<ReturnType<typeof auth>>;
  body: Body;
  query: Query;
  params: Params;
}

interface ApiHandlerOptions<Body, Query, Params> {
  /** Authentication requirement. */
  auth?: "required" | "optional" | "none";
  /** Minimum role rank to access. */
  minRole?: Role;
  /** Specific permission required. */
  permission?: Permission;
  /** Zod schema for request body (POST/PUT/PATCH). */
  body?: ZodSchema<Body>;
  /** Zod schema for query params. */
  query?: ZodSchema<Query>;
  /** Zod schema for path params (Next.js dynamic routes). */
  params?: ZodSchema<Params>;
  /** Handler function — receives parsed context. */
  handler: (ctx: ApiContext<Body, Query, Params>) => Promise<Response> | Response;
}

export function apiHandler<Body = unknown, Query = unknown, Params = unknown>(
  opts: ApiHandlerOptions<Body, Query, Params>
) {
  return async (
    req: NextRequest,
    routeCtx: { params: Promise<Record<string, string>> } | { params: Record<string, string> }
  ): Promise<Response> => {
    try {
      // ── Auth ──
      const session = await auth();
      if (opts.auth !== "none" && opts.auth !== "optional" && !session?.user) {
        return err("Unauthorized", 401);
      }

      // ── Role / permission ──
      const role = session?.user
        ? ((session.user as { role?: string }).role as Role | undefined)
        : undefined;

      if (opts.minRole && !isAtLeast(role, opts.minRole)) {
        return err("Insufficient role", 403);
      }
      if (opts.permission && !hasPermission(role, opts.permission)) {
        return err("Missing permission: " + opts.permission, 403);
      }

      // ── Params ──
      const rawParams = await Promise.resolve(routeCtx.params);
      const params = opts.params ? opts.params.parse(rawParams) : (rawParams as Params);

      // ── Query ──
      const url = new URL(req.url);
      const queryObj = Object.fromEntries(url.searchParams.entries());
      const query = opts.query ? opts.query.parse(queryObj) : (queryObj as Query);

      // ── Body ──
      let body: Body = {} as Body;
      if (opts.body && req.method !== "GET" && req.method !== "DELETE") {
        const json = await req.json().catch(() => ({}));
        body = opts.body.parse(json);
      }

      return await opts.handler({ req, session, body, query, params });
    } catch (e) {
      if (e instanceof ZodError) {
        return err("Validation failed", 422, { issues: e.errors });
      }
      if (e instanceof PermissionError) {
        return err(e.message, e.statusCode);
      }
      console.error("[apiHandler]", e);
      return err("Internal server error", 500);
    }
  };
}

// ── Response helpers ──

export function ok<T>(data: T, status = 200, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status, ...init });
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function paginated<T>(
  items: T[],
  meta: { page: number; pageSize: number; total: number }
) {
  return NextResponse.json({
    ok: true,
    data: items,
    meta: { ...meta, totalPages: Math.ceil(meta.total / meta.pageSize) },
  });
}
