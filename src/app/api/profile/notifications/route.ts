import prisma from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";
import { notificationPreferenceSchema } from "@/lib/validation";

/** GET — current user's preferences (auto-creates with defaults). */
export const GET = apiHandler({
  auth: "required",
  handler: async ({ session }) => {
    const userId = session!.user!.id as string;
    const pref =
      (await prisma.notificationPreference.findUnique({ where: { userId } })) ||
      (await prisma.notificationPreference.create({ data: { userId } }));
    return ok(pref);
  },
});

/** PATCH — partial update. */
export const PATCH = apiHandler({
  auth: "required",
  body: notificationPreferenceSchema,
  handler: async ({ session, body }) => {
    const userId = session!.user!.id as string;
    const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
    const merged = {
      ...(existing ?? {}),
      ...(body.emailEnabled !== undefined && { emailEnabled: body.emailEnabled }),
      ...(body.pushEnabled !== undefined && { pushEnabled: body.pushEnabled }),
      ...(body.digestFrequency !== undefined && { digestFrequency: body.digestFrequency }),
      ...(body.channels && {
        channels: { ...((existing?.channels as object) ?? {}), ...body.channels },
      }),
    };
    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...merged },
      update: merged,
    });
    return ok(pref);
  },
});
