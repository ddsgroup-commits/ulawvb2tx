/**
 * Portal top bar — Bloomberg-density command center.
 *
 * Composition: command/search bar + language switcher + notification bell
 * + user menu. Mounted by (portal)/layout.tsx above the route content.
 */
import { CommandBar } from "./command-bar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserMenu } from "./user-menu";

interface PortalTopbarV2Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function PortalTopbarV2({ user }: PortalTopbarV2Props) {
  return (
    <header className="portal-topbar">
      <CommandBar />
      <div className="flex-1 md:flex-none" />
      <div className="flex items-center gap-1">
        <LanguageSwitcher compact />
        <NotificationBell />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
