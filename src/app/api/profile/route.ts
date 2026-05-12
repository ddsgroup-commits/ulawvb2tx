import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
      createdAt: true, googleLinked: true,
      profile: true,
      privacy: true,
    },
  });

  return ok(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const { name, mssv, phone, facebookUrl, zaloPhone, bio, hometown } = await req.json();

  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: session.user.id },
      data: { ...(name ? { name: name.trim() } : {}) },
    }),
    prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        mssv: mssv ?? null,
        phone: phone ?? null,
        facebookUrl: facebookUrl ?? null,
        zaloPhone: zaloPhone ?? null,
        bio: bio ?? null,
        hometown: hometown ?? null,
      },
      update: {
        ...(mssv !== undefined ? { mssv } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(facebookUrl !== undefined ? { facebookUrl } : {}),
        ...(zaloPhone !== undefined ? { zaloPhone } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(hometown !== undefined ? { hometown } : {}),
      },
    }),
  ]);

  return ok(user);
}
