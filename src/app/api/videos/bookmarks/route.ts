import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const bookmarks = await prisma.videoBookmark.findMany({
    where: { userId: session.user.id },
    include: {
      video: {
        include: { course: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(bookmarks.map(b => b.video));
}
