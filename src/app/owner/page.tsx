import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAtLeast } from "@/lib/permissions";

export default async function OwnerPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/owner");
  }

  // Check if they are SUPER_ADMIN (Owner)
  if (isAtLeast(session.user.role, "SUPER_ADMIN")) {
    redirect("/admin/control-panel");
  }

  // Otherwise redirect to standard portal
  redirect("/portal/dashboard");
}
