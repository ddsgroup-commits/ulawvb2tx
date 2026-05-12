import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalTopbar } from "@/components/layout/PortalTopbar";
import prisma from "@/lib/prisma";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const user = session.user;
  const role = (user.role ?? "STUDENT") as Parameters<typeof PortalSidebar>[0]["role"];

  if (role === "PENDING_USER") redirect("/pending");

  // Get pending user count for admin badge
  let pendingCount = 0;
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    pendingCount = await prisma.user.count({ where: { role: "PENDING_USER" } });
  }

  return (
    <div className="portal-shell">
      <PortalSidebar role={role} userName={user.name ?? user.email ?? ""} pendingCount={pendingCount} />
      <div className="portal-main">
        <PortalTopbar userName={user.name ?? user.email ?? ""} />
        <main className="portal-content">
          {children}
        </main>
      </div>
    </div>
  );
}
