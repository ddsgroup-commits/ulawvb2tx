import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const upcoming = sp.get("upcoming") === "true";
  const courseId = sp.get("courseId") ?? undefined;

  const where = {
    ...(upcoming ? { startAt: { gte: new Date() } } : {}),
    ...(courseId ? { courseId } : {}),
  };

  const events = await prisma.event.findMany({
    where,
    include: { course: { select: { name: true, slug: true } } },
    orderBy: { startAt: "asc" },
    take: upcoming ? 10 : 100,
  });

  return ok(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { title, description, startAt, endAt, type, location, courseId, isExam } = body;

  if (!title?.trim() || !startAt) return err("Thiếu thông tin bắt buộc");

  const event = await prisma.event.create({
    data: {
      title,
      description: description ?? "",
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      type: type ?? "CLASS",
      location: location ?? null,
      courseId: courseId ?? null,
      isExam: isExam ?? false,
    },
  });

  return ok(event, 201);
}
