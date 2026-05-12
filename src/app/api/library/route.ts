import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { LibraryCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") as LibraryCategory | null;

  const items = await prisma.libraryItem.findMany({
    where: {
      isPublic: true,
      ...(category ? { category } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      course: { select: { name: true, slug: true } },
      uploader: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data: items });
}

const createSchema = z.object({
  title: z.string().min(2).max(300),
  category: z.enum(["LEGAL_DOC", "TEXTBOOK", "PAST_EXAM"]),
  description: z.string().optional(),
  fileUrl: z.string().url().optional().nullable().or(z.literal("")),
  driveId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  isPublic: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const data = createSchema.parse(await req.json());
    const item = await prisma.libraryItem.create({
      data: { ...data, uploaderId: session.user.id },
      include: { course: { select: { name: true, slug: true } } },
    });
    return NextResponse.json({ ok: true, data: item }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
