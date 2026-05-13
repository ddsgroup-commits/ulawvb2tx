import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date or ISO string to Vietnamese locale */
export function formatDateVi(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", opts ?? { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTimeVi(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatTimeVi(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/** Days from today to a target date (negative = past) */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Countdown label: "Còn 3 ngày" / "Hết hạn hôm nay" / "Quá hạn 2 ngày" */
export function countdownLabel(date: Date | string | null | undefined): string {
  const days = daysUntil(date);
  if (days === null) return "";
  if (days > 1) return `Còn ${days} ngày`;
  if (days === 1) return "Còn 1 ngày";
  if (days === 0) return "Hôm nay";
  return `Quá hạn ${Math.abs(days)} ngày`;
}

/** Truncate string */
export function truncate(str: string, maxLen = 100): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

/** Initials from full name */
export function getInitials(name: string | null | undefined, fallback = "U"): string {
  if (!name) return fallback;
  return name.split(" ").slice(-2).map(w => w[0] ?? "").join("").toUpperCase() || fallback;
}

/** YouTube video ID from URL */
export function getYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function getYoutubeThumbnail(url: string): string {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : "/thumbnail-placeholder.jpg";
}

/** Tag label maps */
export const TAG_LABELS: Record<string, string> = {
  academic: "Học vụ",
  exam: "Thi cử",
  urgent: "Khẩn",
  event: "Sự kiện",
  general: "Chung",
  financial: "Học phí",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASS: "📅 Học",
  EXAM: "📝 Thi",
  DEADLINE: "⏰ Deadline",
  EVENT: "🎭 Sự kiện",
  MEETING: "👥 Họp",
  VIDEO_RELEASE: "🎬 Video",
};

export function getEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] || type;
}

export function getEventTypeColor(type: string): string {
  switch (type) {
    case "EXAM": return "text-ulaw bg-ulaw/10";
    case "DEADLINE": return "text-orange-600 bg-orange-50";
    case "CLASS": return "text-navy bg-navy/5";
    default: return "text-slate-600 bg-slate-50";
  }
}



/** Role labels in Vietnamese */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  CREATOR: "Creator",
  LECTURER: "Giảng viên",
  STUDENT: "Sinh viên",
  PENDING_USER: "Chờ duyệt",
};

/** Course status labels */
export const COURSE_STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Sắp khai giảng",
  ACTIVE: "Đang học",
  COMPLETED: "Đã hoàn thành",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Đã nộp duyệt",
  UNDER_REVIEW: "Đang xét duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Lưu trữ",
};

/** Slugify Vietnamese text */
export function slugifyVi(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse pagination params from URL */
export function parsePagination(searchParams: URLSearchParams, defaultPageSize = 20) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? String(defaultPageSize))));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

/** Standard API response helpers */
export function ok<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function err(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}
