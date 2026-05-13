import prisma from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";
import { z } from "zod";

export const POST = apiHandler({
  auth: "required",
  body: z.object({ endpoint: z.string().url() }),
  handler: async ({ session, body }) => {
    const userId = session!.user!.id as string;
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: body.endpoint, userId } })
      .catch(() => null);
    return ok({ removed: true });
  },
});
