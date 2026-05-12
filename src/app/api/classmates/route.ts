import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return err("Unauthorized", 401);

  // Get current user's privacy settings
  const myPrivacy = await prisma.privacySetting.findUnique({
    where: { userId: session.user.id },
  });

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["STUDENT", "LECTURER", "CREATOR", "MODERATOR"] },
    },
    select: {
      id: true,
      name: true,
      role: true,
      profile: {
        select: {
          mssv: true,
          phone: true,
          facebookUrl: true,
          zaloPhone: true,
          bio: true,
          hometown: true,
        },
      },
      privacy: {
        select: {
          showEmail: true,
          showPhone: true,
          showMssv: true,
          showFacebook: true,
          showZalo: true,
          showBio: true,
          showHometown: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Filter fields by privacy settings
  const data = users.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    mssv: u.privacy?.showMssv ? u.profile?.mssv : null,
    phone: u.privacy?.showPhone ? u.profile?.phone : null,
    facebook: u.privacy?.showFacebook ? u.profile?.facebookUrl : null,
    zalo: u.privacy?.showZalo ? u.profile?.zaloPhone : null,
    bio: u.privacy?.showBio ? u.profile?.bio : null,
    hometown: u.privacy?.showHometown ? u.profile?.hometown : null,
  }));

  return ok({ items: data, myPrivacy });
}
