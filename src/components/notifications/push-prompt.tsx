"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Convert URL-safe base64 → Uint8Array, as required by PushManager.subscribe.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Std = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Std);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const STORAGE_KEY = "ulaw-push-prompt-dismissed";

export function PushPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    // Delay 8s so we don't slap the user on first paint.
    const t = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const { key } = await fetch("/api/push/vapid-public-key").then((r) => r.json());
      if (!key) {
        toast.error("Server chưa cấu hình VAPID key");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      toast.success("Đã bật thông báo đẩy");
      setShow(false);
    } catch (e) {
      console.error(e);
      toast.error("Không bật được thông báo đẩy");
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm bg-white rounded-2xl shadow-card-hover border border-slate-200 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
        <BellRing className="h-5 w-5 text-navy" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-navy-dark text-sm">Bật thông báo đẩy?</h4>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Nhận thông báo deadline, lịch học và thông báo lớp ngay cả khi không mở trình duyệt.
        </p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={enable}>
            Bật ngay
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Để sau
          </Button>
        </div>
      </div>
      <button onClick={dismiss} className="text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
