import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const replies = await prisma.discussionReply.findMany({
    where: { discussionId: params.id },
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return ok(replies);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const { body } = await req.json();
  if (!body?.trim()) return err("Nội dung không được trống");

  const reply = await prisma.discussionReply.create({
    data: { body: body.trim(), discussionId: params.id, authorId: session.user.id },
    include: { author: { select: { name: true, role: true } } },
  });

  return ok(reply, 201);
}
