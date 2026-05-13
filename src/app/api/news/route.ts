import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

// Accessible to all authenticated users including PENDING_USER.
// Returns school-wide announcements (no courseId) that are published.
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const announcements = await prisma.announcement.findMany({
    where: {
      courseId: null,
      published: true,
      status: "PUBLISHED",
      AND: [
        { OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      tag: true,
      pinned: true,
      urgent: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  return ok(announcements);
}
