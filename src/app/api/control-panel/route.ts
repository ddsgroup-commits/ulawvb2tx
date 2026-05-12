import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  ALL_FLAG_KEYS,
  getFlags,
  invalidateFlagsCache,
  isBooleanFlag,
  isStringFlag,
} from "@/lib/feature-flags";

// GET /api/control-panel — current flag values
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }
  const flags = await getFlags();
  return NextResponse.json({ ok: true, data: flags });
}

// PUT /api/control-panel — patch one or more keys
const patchSchema = z.record(z.string(), z.union([z.boolean(), z.string()]));

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = patchSchema.parse(await req.json());

    const ops: Promise<unknown>[] = [];
    const applied: Record<string, string> = {};

    for (const [key, raw] of Object.entries(body)) {
      if (!(ALL_FLAG_KEYS as readonly string[]).includes(key)) continue;

      let stringValue: string;
      if (isBooleanFlag(key)) {
        if (typeof raw !== "boolean") continue;
        stringValue = raw ? "true" : "false";
      } else if (isStringFlag(key)) {
        if (typeof raw !== "string") continue;
        stringValue = raw;
      } else {
        continue;
      }

      applied[key] = stringValue;
      ops.push(
        prisma.siteConfig.upsert({
          where: { key },
          update: { value: stringValue },
          create: { key, value: stringValue },
        }),
      );
    }

    await Promise.all(ops);
    invalidateFlagsCache();

    await logAudit(req, session.user.id, "UPDATE_FEATURE_FLAGS", "SiteConfig", null, applied);

    const flags = await getFlags();
    return NextResponse.json({ ok: true, data: flags, applied });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    console.error("[control-panel PUT]", e);
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
