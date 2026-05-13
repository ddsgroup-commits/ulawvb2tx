import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err, slugify } from "@/lib/utils";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: {
      lecturer: { select: { id: true, name: true } }
    }
  });

  return ok(courses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { name, code, credits, icon, description, status, lecturerId, notebooklmUrl, driveUrl } = body;

  if (!name || !code) return err("Name and Code are required");

  const course = await prisma.course.create({
    data: {
      name,
      slug: slugify(name),
      code,
      credits: parseInt(credits) || 0,
      icon,
      description,
      status: status || "UPCOMING",
      lecturerId,
      notebooklmUrl,
      driveUrl
    }
  });

  await logAudit({
    action: "CONTENT_PUBLISHED",
    actorId: session.user.id,
    entity: "Course",
    entityId: course.id,
    detail: { name, code },
    ipAddress: getClientIp(req),
  });

  return ok(course);
}
