import prisma from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";
import { pushSubscriptionSchema } from "@/lib/validation";

/** POST /api/push/subscribe — store a browser PushSubscription. */
export const POST = apiHandler({
  auth: "required",
  body: pushSubscriptionSchema,
  handler: async ({ session, body }) => {
    const userId = session!.user!.id as string;
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent,
      },
      update: {
        userId,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        lastUsed: new Date(),
      },
    });
    return ok(sub, 201);
  },
});
