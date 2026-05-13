import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const items = await prisma.libraryItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { name: true } },
      uploader: { select: { name: true, email: true } }
    }
  });

  return ok(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  const body = await req.json();
  const { title, description, fileUrl, fileType, category, courseId } = body;

  if (!title || !fileUrl) return err("Title and File URL are required");

  const item = await prisma.libraryItem.create({
    data: {
      title,
      description,
      fileUrl,
      fileType,
      category,
      courseId: courseId || null,
      uploaderId: session.user.id,
      status: ["SUPER_ADMIN", "ADMIN"].includes(session.user.role) ? "PUBLISHED" : "SUBMITTED"
    }
  });

  return ok(item);
}
