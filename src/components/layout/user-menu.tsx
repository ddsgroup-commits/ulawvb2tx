"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, Settings, Bell, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

function roleVariant(role?: string) {
  switch (role) {
    case "SUPER_ADMIN": return "purple";
    case "ADMIN": return "default";
    case "MODERATOR": return "blue";
    case "LECTURER": return "gold";
    case "CREATOR": return "green";
    default: return "gray";
  }
}

function initials(name?: string | null) {
  if (!name) return "U";
  return name.split(" ").slice(-2).map((s) => s[0] ?? "").join("").toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const role = user.role ?? "STUDENT";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-slate-100 transition-colors p-1 pr-3">
        <Avatar className="h-8 w-8">
          {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
          {user.name ?? user.email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-3 py-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-navy-dark truncate">{user.name ?? "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <Badge variant={roleVariant(role) as any} className="mt-1 text-[9px]">
              {role}
            </Badge>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/portal/profile"><User className="h-4 w-4" /> Hồ sơ cá nhân</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal/profile/notifications"><Bell className="h-4 w-4" /> Thông báo</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal/ai-assistant"><Sparkles className="h-4 w-4" /> Trợ lý AI</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal/profile/security"><ShieldCheck className="h-4 w-4" /> Bảo mật</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal/profile"><Settings className="h-4 w-4" /> Cài đặt</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-ulaw focus:text-ulaw focus:bg-ulaw/5"
        >
          <LogOut className="h-4 w-4" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
