"use client";

import { useEffect } from "react";

/**
 * Mounts in RootLayout. Registers /sw.js on first paint so the PWA
 * features (offline fallback, push notifications, install prompt)
 * become available. Re-registers on hot reloads in dev are no-ops.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.error("[sw] registration failed:", e);
    });
  }, []);
  return null;
}
