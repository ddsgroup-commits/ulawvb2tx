import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const config = await prisma.siteConfig.findFirst({ where: { id: "default" } });
  return ok(config);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { 
    siteName, siteDescription, contactEmail, zaloGroupUrl, facebookGroupUrl, 
    maintenanceMode, heroTitle, heroSubtitle, stats, features, quickLinks 
  } = body;

  const config = await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {
      siteName,
      siteDescription,
      contactEmail,
      zaloGroupUrl,
      facebookGroupUrl,
      maintenanceMode,
      heroTitle,
      heroSubtitle,
      stats,
      features,
      quickLinks,
    },
    create: {
      id: "default",
      siteName,
      siteDescription,
      contactEmail,
      zaloGroupUrl,
      facebookGroupUrl,
      maintenanceMode,
      heroTitle,
      heroSubtitle,
      stats,
      features,
      quickLinks,
    },
  });

  await logAudit({
    action: "SYSTEM_SETTING_CHANGED",
    actorId: session.user.id,
    detail: body,
    ipAddress: getClientIp(req),
  });

  return ok(config);
}
