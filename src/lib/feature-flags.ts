// =============================================================
// Feature flags + site config — read from the SiteConfig table.
//
// The admin Control Panel (/admin/control-panel) writes here. Any
// page or middleware can `await getFlags()` to gate features without
// a redeploy. Keep this file dependency-free so it can be imported
// from server components, API routes, and middleware alike.
// =============================================================

import { prisma } from "@/lib/prisma";

export interface FeatureFlags {
  // ── Major modules ────────────────────────────────────────
  lmsEnabled: boolean;          // /courses, /my-learning, lessons
  videoLibraryEnabled: boolean; // /videos
  documentLibraryEnabled: boolean; // /library
  aiHubEnabled: boolean;        // /ai-hub
  announcementsEnabled: boolean;
  scheduleEnabled: boolean;
  contactsEnabled: boolean;
  faqEnabled: boolean;

  // ── Behaviour switches ───────────────────────────────────
  publicHomepageEnabled: boolean; // serve the static homepage
  registrationEnabled: boolean;   // future: self-signup
  maintenanceMode: boolean;       // banner + block writes
  forcePasswordReset: boolean;    // honor User.mustChangePassword

  // ── Class / branding ─────────────────────────────────────
  className: string;
  semester: string;
  contactEmail: string;
  zaloGroupUrl: string;
  googleCalendarUrl: string;
  attendanceUrl: string;
  googleDriveUrl: string;

  // ── Notices ──────────────────────────────────────────────
  maintenanceMessage: string;
  topBannerText: string; // shown to all students on dashboard
}

const DEFAULTS: FeatureFlags = {
  lmsEnabled: true,
  videoLibraryEnabled: true,
  documentLibraryEnabled: true,
  aiHubEnabled: true,
  announcementsEnabled: true,
  scheduleEnabled: true,
  contactsEnabled: true,
  faqEnabled: true,
  publicHomepageEnabled: true,
  registrationEnabled: false,
  maintenanceMode: false,
  forcePasswordReset: false,
  className: "VB2 Luật – ULAW HCM 2025",
  semester: "Học kỳ I – 2026",
  contactEmail: "vb2luat2025@gmail.com",
  zaloGroupUrl: "",
  googleCalendarUrl: "https://calendar.google.com/calendar/u/0?cid=YTc5NWI4NjZhYTMyMTc2OTM3NTUzZTlhN2FiYTFmYTYyYmFlMTA4NDRmZTRkY2E1ZTQwZmUyM2JlNTQzOTExMEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t",
  attendanceUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc5GnrHF6lxWStYq1ZbZAufMWfyztKUqhBbkOMCODos6Kgn-g/viewform?pli=1&fbzx=7648764533728581110",
  googleDriveUrl: "https://drive.google.com/drive/folders/1BXN3PSRTnlMf4g5xmAR8U471hIsbnMoI?usp=drive_link",
  maintenanceMessage: "Hệ thống đang bảo trì. Vui lòng quay lại sau ít phút.",
  topBannerText: "",
};

const BOOLEAN_KEYS: ReadonlyArray<keyof FeatureFlags> = [
  "lmsEnabled",
  "videoLibraryEnabled",
  "documentLibraryEnabled",
  "aiHubEnabled",
  "announcementsEnabled",
  "scheduleEnabled",
  "contactsEnabled",
  "faqEnabled",
  "publicHomepageEnabled",
  "registrationEnabled",
  "maintenanceMode",
  "forcePasswordReset",
] as const;

const STRING_KEYS: ReadonlyArray<keyof FeatureFlags> = [
  "className",
  "semester",
  "contactEmail",
  "zaloGroupUrl",
  "googleCalendarUrl",
  "attendanceUrl",
  "googleDriveUrl",
  "maintenanceMessage",
  "topBannerText",
] as const;

export const ALL_FLAG_KEYS: ReadonlyArray<keyof FeatureFlags> = [
  ...BOOLEAN_KEYS,
  ...STRING_KEYS,
];

export function isBooleanFlag(k: string): k is keyof FeatureFlags {
  return (BOOLEAN_KEYS as readonly string[]).includes(k);
}

export function isStringFlag(k: string): k is keyof FeatureFlags {
  return (STRING_KEYS as readonly string[]).includes(k);
}

// In-process cache. We invalidate on every write so admins see their
// changes immediately; for read-heavy paths this keeps DB load near zero.
let cache: { value: FeatureFlags; loadedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getFlags(): Promise<FeatureFlags> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.value;
  const rows = await prisma.siteConfig.findMany();
  const flags: FeatureFlags = { ...DEFAULTS };
  for (const r of rows) {
    if (!(r.key in DEFAULTS)) continue;
    const key = r.key as keyof FeatureFlags;
    if (isBooleanFlag(key)) {
      (flags as any)[key] = r.value === "true";
    } else if (isStringFlag(key)) {
      (flags as any)[key] = r.value;
    }
  }
  cache = { value: flags, loadedAt: Date.now() };
  return flags;
}

export function invalidateFlagsCache() {
  cache = null;
}

export const DEFAULT_FLAGS = DEFAULTS;
