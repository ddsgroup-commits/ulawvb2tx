import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookmarks — list caller's bookmarks (optionally ?type=)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      ...(type && ["LESSON", "VIDEO", "LIBRARY_ITEM", "COURSE"].includes(type)
        ? { type: type as "LESSON" | "VIDEO" | "LIBRARY_ITEM" | "COURSE" }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data: bookmarks });
}

// POST /api/bookmarks — toggle a bookmark on/off (idempotent)
const toggleSchema = z.object({
  type: z.enum(["LESSON", "VIDEO", "LIBRARY_ITEM", "COURSE"]),
  itemId: z.string().min(1),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  try {
    const data = toggleSchema.parse(await req.json());

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_type_itemId: {
          userId: session.user.id,
          type: data.type,
          itemId: data.itemId,
        },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, data: { bookmarked: false } });
    }

    await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        type: data.type,
        itemId: data.itemId,
        note: data.note ?? null,
      },
    });
    return NextResponse.json({ ok: true, data: { bookmarked: true } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
