import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const existing = await prisma.videoBookmark.findUnique({
    where: { userId_videoId: { userId: session.user.id, videoId: params.id } },
  });

  if (existing) {
    await prisma.videoBookmark.delete({ where: { id: existing.id } });
    return ok({ bookmarked: false });
  }

  await prisma.videoBookmark.create({
    data: { userId: session.user.id, videoId: params.id },
  });
  return ok({ bookmarked: true });
}
