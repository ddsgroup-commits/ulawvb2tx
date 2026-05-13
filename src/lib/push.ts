/**
 * Web Push (VAPID) via the `web-push` package.
 *
 * Setup:
 *   1. `pnpm vapid:keys` — generates VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
 *   2. Add both to .env, and copy the public key to NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *      so the client can pass it to PushManager.subscribe().
 *
 * sendWebPush is a no-op (returns false) if VAPID keys are missing — same
 * graceful degradation pattern as lib/email.
 */
import webpush from "web-push";
import type { PushSubscription } from "@prisma/client";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@ulawvb2tx.com";
  if (!pub || !priv) {
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export async function sendWebPush(sub: PushSubscription, payload: PushPayload) {
  if (!configure()) {
    console.warn("[push] VAPID keys missing — skipping:", payload.title);
    return false;
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/portal/dashboard",
        icon: payload.icon ?? "/icons/icon-192.png",
        badge: payload.badge ?? "/icons/badge-72.png",
      })
    );
    return true;
  } catch (e: any) {
    // Re-throw with statusCode so caller can recognize 404/410 (gone).
    throw e;
  }
}

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}
