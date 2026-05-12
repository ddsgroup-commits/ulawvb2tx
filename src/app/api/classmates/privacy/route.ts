import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const body = await req.json();
  const {
    showEmail, showPhone, showMssv, showFacebook,
    showZalo, showBio, showHometown, showRole,
  } = body;

  const privacy = await prisma.privacySetting.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      showEmail: showEmail ?? true,
      showPhone: showPhone ?? false,
      showMssv: showMssv ?? true,
      showFacebook: showFacebook ?? false,
      showZalo: showZalo ?? false,
      showBio: showBio ?? true,
      showHometown: showHometown ?? true,
      showRole: showRole ?? true,
    },
    update: {
      ...(showEmail !== undefined ? { showEmail } : {}),
      ...(showPhone !== undefined ? { showPhone } : {}),
      ...(showMssv !== undefined ? { showMssv } : {}),
      ...(showFacebook !== undefined ? { showFacebook } : {}),
      ...(showZalo !== undefined ? { showZalo } : {}),
      ...(showBio !== undefined ? { showBio } : {}),
      ...(showHometown !== undefined ? { showHometown } : {}),
      ...(showRole !== undefined ? { showRole } : {}),
    },
  });

  await logAudit({
    action: "PRIVACY_CHANGED",
    actorId: session.user.id,
    ipAddress: getClientIp(req),
  });

  return ok(privacy);
}
