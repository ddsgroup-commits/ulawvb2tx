import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json();
  
  const item = await prisma.libraryItem.update({
    where: { id },
    data: body
  });

  return ok(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const { id } = await params;
  await prisma.libraryItem.delete({ where: { id } });

  return ok({ deleted: true });
}
