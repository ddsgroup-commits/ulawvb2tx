"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?pageSize=10", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.data.items);
        setUnread(json.data.unread);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll every 60s. When we add SSE/WebSockets in Phase 4, swap this
    // for a real-time subscription so the dot lights up immediately.
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    setUnread(0);
    toast.success("Đã đánh dấu tất cả là đã đọc");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ulaw text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <DropdownMenuLabel className="p-0 text-sm font-bold normal-case tracking-normal text-navy-dark">
            Thông báo {unread > 0 && <span className="text-ulaw">({unread})</span>}
          </DropdownMenuLabel>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Đọc tất cả
            </Button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">Đang tải…</div>
          ) : items.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <Inbox className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Không có thông báo nào</p>
            </div>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                  setOpen(false);
                }}
                className={cn(
                  "block px-4 py-3 border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50",
                  !n.read && "bg-navy-50/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      n.read ? "bg-transparent" : "bg-ulaw"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        n.read ? "text-slate-600 font-normal" : "text-navy-dark font-semibold"
                      )}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: viLocale })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <Link
          href="/portal/profile/notifications"
          className="block px-4 py-3 text-center text-sm font-medium text-navy hover:bg-slate-50"
        >
          Xem tất cả & cài đặt thông báo →
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
