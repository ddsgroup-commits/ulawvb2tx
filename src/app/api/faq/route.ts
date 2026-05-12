import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const faqs = await prisma.fAQ.findMany({
    where: { published: true },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return ok(faqs);
}
