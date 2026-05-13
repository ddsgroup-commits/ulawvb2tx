/**
 * Notification service — single entry point for emitting notifications.
 *
 * Fans out to three channels based on the user's NotificationPreference:
 *   1. IN_APP  — always persisted as a Notification row.
 *   2. EMAIL   — via lib/email (SMTP/Resend); skipped if user.emailEnabled = false.
 *   3. PUSH    — via lib/push (web-push + VAPID); skipped if user has no
 *                PushSubscription or pushEnabled = false.
 *
 * Failures in any channel are logged but never throw — a flaky SMTP
 * connection must not block a course announcement from being created.
 */
import prisma from "./prisma";
import { sendEmail } from "./email";
import { sendWebPush } from "./push";
import type { NotificationType, NotificationChannel } from "@prisma/client";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  entity?: string;
  entityId?: string;
  /** Channel hint — defaults respect user preferences. */
  channelHint?: NotificationChannel[];
}

interface NotifyManyInput extends Omit<NotifyInput, "userId"> {
  userIds: string[];
}

const TYPE_TO_CHANNEL_KEY: Partial<Record<NotificationType, string>> = {
  ANNOUNCEMENT: "announcements",
  ASSIGNMENT_DUE: "assignments",
  ASSIGNMENT_GRADED: "grades",
  QUIZ_AVAILABLE: "assignments",
  QUIZ_GRADED: "grades",
  CLASS_REMINDER: "calendar",
  EXAM_REMINDER: "calendar",
  FORUM_REPLY: "forum",
  FORUM_MENTION: "forum",
  ATTENDANCE_OPENED: "calendar",
};

export async function notify(input: NotifyInput) {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: input.userId },
  });

  const channelKey = TYPE_TO_CHANNEL_KEY[input.type];
  const channelEnabled =
    !channelKey ||
    !pref?.channels ||
    (pref.channels as Record<string, boolean>)[channelKey] !== false;

  if (!channelEnabled) return null;

  const delivered: NotificationChannel[] = ["IN_APP"];

  // Persist in-app notification first — that's the source of truth.
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      entity: input.entity,
      entityId: input.entityId,
      channels: delivered,
    },
  });

  // Email — best-effort.
  if (pref?.emailEnabled !== false && pref?.digestFrequency !== "OFF") {
    try {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `[ULAW VB2-TX] ${input.title}`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#1F3A68">${escapeHtml(input.title)}</h2>
              ${input.body ? `<p style="color:#475569;line-height:1.6">${escapeHtml(input.body)}</p>` : ""}
              ${input.link ? `<a href="${input.link}" style="display:inline-block;background:#1F3A68;color:white;padding:10px 18px;border-radius:8px;text-decoration:none;margin-top:12px">Xem trên Portal</a>` : ""}
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
              <p style="font-size:12px;color:#94a3b8">
                Bạn nhận email này vì đã đăng ký nhận thông báo từ ULAW VB2-TX LMS.
                <a href="${baseUrl()}/portal/profile/notifications">Quản lý thông báo</a>.
              </p>
            </div>
          `,
        });
        delivered.push("EMAIL");
      }
    } catch (e) {
      console.error("[notify] email failed:", e);
    }
  }

  // Web Push — best-effort.
  if (pref?.pushEnabled !== false) {
    try {
      const subs = await prisma.pushSubscription.findMany({ where: { userId: input.userId } });
      for (const sub of subs) {
        await sendWebPush(sub, {
          title: input.title,
          body: input.body ?? "",
          url: input.link ?? "/portal/dashboard",
        }).catch(async (e) => {
          // Expired / gone — clean up.
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.error("[notify] push failed:", e);
          }
        });
      }
      if (subs.length) delivered.push("PUSH");
    } catch (e) {
      console.error("[notify] push setup failed:", e);
    }
  }

  // Update channels if anything beyond IN_APP succeeded.
  if (delivered.length > 1) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { channels: delivered },
    });
  }

  return notification;
}

export async function notifyMany(input: NotifyManyInput) {
  const results = await Promise.allSettled(
    input.userIds.map((userId) => notify({ ...input, userId }))
  );
  return {
    sent: results.filter((r) => r.status === "fulfilled" && r.value).length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://ulawvb2tx.com";
}
