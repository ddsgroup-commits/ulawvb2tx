import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const { id } = await params;
  const body = await req.json();
  
  const faq = await prisma.fAQ.update({
    where: { id },
    data: {
      ...body,
      ...(body.order ? { order: parseInt(body.order) } : {})
    }
  });

  return ok(faq);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const { id } = await params;

  await prisma.fAQ.delete({ where: { id } });

  return ok({ deleted: true });
}
