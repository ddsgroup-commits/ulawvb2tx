import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const config = await prisma.siteConfig.findFirst();
  return ok(config);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { siteName, siteDescription, contactEmail, zaloGroupUrl, facebookGroupUrl, maintenanceMode } = body;

  const existing = await prisma.siteConfig.findFirst();
  const data = {
    ...(siteName !== undefined ? { siteName } : {}),
    ...(siteDescription !== undefined ? { siteDescription } : {}),
    ...(contactEmail !== undefined ? { contactEmail } : {}),
    ...(zaloGroupUrl !== undefined ? { zaloGroupUrl } : {}),
    ...(facebookGroupUrl !== undefined ? { facebookGroupUrl } : {}),
    ...(maintenanceMode !== undefined ? { maintenanceMode } : {}),
  };

  let config;
  if (existing) {
    config = await prisma.siteConfig.update({ where: { id: existing.id }, data });
  } else {
    config = await prisma.siteConfig.create({ data: { siteName: siteName ?? "ULAW VB2-TX LMS", ...data } });
  }

  await logAudit({
    action: "SYSTEM_SETTING_CHANGED",
    actorId: session.user.id,
    detail: data,
    ipAddress: getClientIp(req),
  });

  return ok(config);
}
