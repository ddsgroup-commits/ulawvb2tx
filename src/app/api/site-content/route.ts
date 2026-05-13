import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  try {
    const [config, announcements, courses] = await Promise.all([
      prisma.siteConfig.findFirst({
        where: { id: "default" }
      }),
      prisma.announcement.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          tag: true,
          createdAt: true,
        }
      }),
      prisma.course.findMany({
        where: { status: "ACTIVE" },
        orderBy: { order: "asc" },
        take: 6,
        select: {
          id: true,
          name: true,
          code: true,
          credits: true,
          icon: true,
          status: true,
          slug: true,
        }
      })
    ]);

    return ok({
      config,
      announcements,
      courses
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
