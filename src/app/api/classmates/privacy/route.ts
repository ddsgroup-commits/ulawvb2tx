import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

// Privacy fields are all booleans toggling whether a particular profile
// attribute is visible to other classmates. Field names mirror the
// PrivacySetting model in schema.prisma — keep them in sync if you
// add new attributes there.
const PRIVACY_FIELDS = [
  "sharePhone",
  "shareZalo",
  "sharePersonalEmail",
  "shareWorkplace",
  "shareJobTitle",
  "shareCity",
  "shareBio",
  "shareSocialLinks",
  "shareAvatar",
] as const;
type PrivacyField = (typeof PRIVACY_FIELDS)[number];
type PrivacyPatch = Partial<Record<PrivacyField, boolean>>;

function parsePrivacy(raw: unknown): PrivacyPatch {
  if (!raw || typeof raw !== "object") return {};
  const out: PrivacyPatch = {};
  for (const k of PRIVACY_FIELDS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const data = parsePrivacy(body);
  if (Object.keys(data).length === 0) {
    return err("No valid privacy fields supplied", 400);
  }

  // Build a `create` payload: anything omitted falls back to the
  // schema's documented default. We re-state the safe defaults here
  // so the create branch is explicit and stable if upstream changes.
  const privacy = await prisma.privacySetting.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      sharePhone:         data.sharePhone         ?? false,
      shareZalo:          data.shareZalo          ?? false,
      sharePersonalEmail: data.sharePersonalEmail ?? false,
      shareWorkplace:     data.shareWorkplace     ?? false,
      shareJobTitle:      data.shareJobTitle      ?? false,
      shareCity:          data.shareCity          ?? false,
      shareBio:           data.shareBio           ?? false,
      shareSocialLinks:   data.shareSocialLinks   ?? false,
      shareAvatar:        data.shareAvatar        ?? true,
    },
    update: data,
  });

  await logAudit({
    action: "PRIVACY_CHANGED",
    actorId: session.user.id,
    ipAddress: getClientIp(req),
  });

  return ok(privacy);
}
