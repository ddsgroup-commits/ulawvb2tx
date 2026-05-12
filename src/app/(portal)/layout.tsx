import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalTopbar } from "@/components/layout/PortalTopbar";
import { getFlags } from "@/lib/feature-flags";
import { Wrench } from "lucide-react";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // PENDING_USER: redirect to pending page (only allowed to see /pending)
  if (session.user.role === "PENDING_USER") redirect("/pending");

  const flags = await getFlags();
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(session.user.role);

  // Build the list of enabled portal paths so the sidebar / topbar can
  // hide nav items that admins have turned off. Admins always see
  // everything so they can manage content even when modules are dark.
  const enabledPaths = isAdmin
    ? null
    : buildEnabledPaths(flags);

  // Maintenance mode short-circuits non-admins to a friendly page.
  if (flags.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-dark">Đang bảo trì</h1>
          <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed">
            {flags.maintenanceMessage}
          </p>
          <p className="text-xs text-slate-400 mt-4">
            Liên hệ Ban cán sự nếu cần hỗ trợ gấp · {flags.contactEmail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar enabledPaths={enabledPaths} />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopbar enabledPaths={enabledPaths} />

        {/* Site-wide banner from Control Panel */}
        {flags.topBannerText && (
          <div className="bg-ulaw-red text-white text-center text-sm py-2 px-4 font-medium">
            {flags.topBannerText}
          </div>
        )}
        {flags.maintenanceMode && isAdmin && (
          <div className="bg-amber-100 text-amber-900 text-center text-xs py-1.5 px-4 font-semibold">
            🛠 Chế độ bảo trì đang BẬT — sinh viên thấy trang bảo trì. Bạn vẫn truy cập được vì là admin.
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function buildEnabledPaths(flags: Awaited<ReturnType<typeof getFlags>>): string[] {
  // Always-on paths (dashboard, my-learning, courses still useful even with LMS off).
  const paths = ["/dashboard", "/my-learning", "/courses"];
  if (flags.lmsEnabled) paths.push("/courses");
  if (flags.announcementsEnabled) paths.push("/announcements");
  if (flags.scheduleEnabled) paths.push("/schedule");
  if (flags.videoLibraryEnabled) paths.push("/videos");
  if (flags.documentLibraryEnabled) paths.push("/library");
  if (flags.aiHubEnabled) paths.push("/ai-hub");
  if (flags.contactsEnabled) paths.push("/contacts");
  if (flags.faqEnabled) paths.push("/faq");
  return Array.from(new Set(paths));
}
