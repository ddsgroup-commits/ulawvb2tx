import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const item = await prisma.announcement.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.pinned !== undefined ? { pinned: body.pinned } : {}),
      ...(body.published !== undefined ? { published: body.published } : {}),
      ...(body.publishAt !== undefined ? { publishAt: new Date(body.publishAt) } : {}),
    },
  });
  return ok(item);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  await prisma.announcement.delete({ where: { id: params.id } });
  return ok({ deleted: params.id });
}
