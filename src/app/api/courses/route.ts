import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, slug: true, code: true, credits: true,
      status: true, color: true, icon: true,
      lecturer: { select: { name: true } },
    },
    orderBy: { order: "asc" },
  });

  return ok(courses);
}
