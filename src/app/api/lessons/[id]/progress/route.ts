import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/lessons/[id]/progress
// Marks the lesson viewed and optionally completes it. Called from
// the lesson watch page on mount (lightweight) and on "mark complete".
//
// Body:
//   { completed?: boolean, watchTimeDelta?: number }
//
// - completed=true sets `completed`+`completedAt` (idempotent).
// - completed=false clears completion (un-mark).
// - watchTimeDelta increments accumulated watch seconds.
const progressSchema = z.object({
  completed: z.boolean().optional(),
  watchTimeDelta: z.number().int().min(0).max(7200).optional(), // up to 2h per call
});

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }

  // Verify lesson exists and is visible to this student.
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { id: true, status: true, courseId: true },
  });
  if (!lesson) return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(session.user.role);
  if (!isAdmin && lesson.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
  }

  let body: z.infer<typeof progressSchema>;
  try {
    body = progressSchema.parse(await req.json().catch(() => ({})));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    throw e;
  }

  const now = new Date();
  const completed = body.completed;
  const delta = body.watchTimeDelta ?? 0;

  const progress = await prisma.lessonProgress.upsert({
    where: { lessonId_userId: { lessonId: id, userId: session.user.id } },
    update: {
      lastViewedAt: now,
      ...(delta > 0 ? { watchTimeSec: { increment: delta } } : {}),
      ...(completed === true ? { completed: true, completedAt: now } : {}),
      ...(completed === false ? { completed: false, completedAt: null } : {}),
    },
    create: {
      lessonId: id,
      userId: session.user.id,
      lastViewedAt: now,
      watchTimeSec: delta,
      completed: completed === true,
      completedAt: completed === true ? now : null,
    },
  });

  return NextResponse.json({ ok: true, data: progress });
}
