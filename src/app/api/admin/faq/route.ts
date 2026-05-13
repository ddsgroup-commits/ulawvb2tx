import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const faqs = await prisma.fAQ.findMany({
    orderBy: { order: "asc" }
  });

  return ok(faqs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return err("Forbidden", 403);

  const body = await req.json();
  const { question, answer, category, order } = body;

  if (!question || !answer) return err("Question and Answer are required");

  const faq = await prisma.fAQ.create({
    data: { question, answer, category, order: parseInt(order) || 0 }
  });

  return ok(faq);
}
