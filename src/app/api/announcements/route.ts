import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { AnnouncementTag } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  tag: z.enum(["LICH_HOC", "DEADLINE", "THAY_DOI", "THI_CU", "CHUNG_CHI", "KHAC"]),
  pinned: z.boolean().optional().default(false),
  urgent: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? 10));
    const tag = searchParams.get("tag") as AnnouncementTag | null;
    const q = searchParams.get("q") ?? "";

    const where = {
      published: true,
      ...(tag ? { tag } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: { author: { select: { id: true, name: true } } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });

  const role = session.user.role;
  if (!["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role)) {
    return NextResponse.json({ ok: false, error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: { ...data, authorId: session.user.id },
      include: { author: { select: { id: true, name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_ANNOUNCEMENT",
        entityType: "Announcement",
        entityId: announcement.id,
      },
    });

    return NextResponse.json({ ok: true, data: announcement }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
