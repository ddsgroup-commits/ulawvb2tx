import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalTopbarV2 } from "@/components/layout/PortalTopbarV2";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PushPrompt } from "@/components/notifications/push-prompt";
import prisma from "@/lib/prisma";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const role = (user.role ?? "STUDENT") as Parameters<typeof PortalSidebar>[0]["role"];

  if (role === "PENDING_USER") redirect("/pending");

  // Pending count for admin sidebar badge.
  let pendingCount = 0;
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    pendingCount = await prisma.user.count({ where: { role: "PENDING_USER" } });
  }

  return (
    <div className="portal-shell">
      <PortalSidebar
        role={role}
        userName={user.name ?? user.email ?? ""}
        pendingCount={pendingCount}
      />
      <div className="portal-content">
        <PortalTopbarV2
          user={{
            name: user.name,
            email: user.email,
            image: (user as { image?: string }).image,
            role,
          }}
        />
        <main className="portal-main pb-24 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
      <PushPrompt />
    </div>
  );
}
