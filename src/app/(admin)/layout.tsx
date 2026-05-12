import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalTopbar } from "@/components/layout/PortalTopbar";
import prisma from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as string;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) redirect("/portal/dashboard");

  const pendingCount = await prisma.user.count({ where: { role: "PENDING_USER" } });

  return (
    <div className="portal-shell">
      <PortalSidebar
        role={role as "SUPER_ADMIN" | "ADMIN"}
        userName={session.user.name ?? session.user.email ?? ""}
        pendingCount={pendingCount}
      />
      <div className="portal-main">
        <PortalTopbar userName={session.user.name ?? session.user.email ?? ""} />
        <main className="portal-content">
          {children}
        </main>
      </div>
    </div>
  );
}
