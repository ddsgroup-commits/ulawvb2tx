import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import type { Role, ContentStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateVi(date: Date | string, fmt = "dd/MM/yyyy") {
  return format(new Date(date), fmt, { locale: vi });
}

export function formatDatetimeVi(date: Date | string) {
  return format(new Date(date), "HH:mm, dd/MM/yyyy", { locale: vi });
}

export function relativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function daysUntil(date: Date | string): number {
  return differenceInDays(new Date(date), new Date());
}

// ── Role helpers ──────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:  "Quản trị cao nhất",
  ADMIN:        "Quản trị viên",
  MODERATOR:    "Kiểm duyệt viên",
  CREATOR:      "Người tạo nội dung",
  STUDENT:      "Sinh viên",
  PENDING_USER: "Chờ phê duyệt",
};

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN:  "bg-red-100 text-red-700",
  ADMIN:        "bg-navy-100 text-navy-700",
  MODERATOR:    "bg-purple-100 text-purple-700",
  CREATOR:      "bg-blue-100 text-blue-700",
  STUDENT:      "bg-green-100 text-green-700",
  PENDING_USER: "bg-amber-100 text-amber-700",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN:  "Toàn quyền hệ thống, quản lý tất cả người dùng và nội dung",
  ADMIN:        "Quản lý vận hành, phê duyệt sinh viên, đăng nội dung trực tiếp",
  MODERATOR:    "Kiểm duyệt và phê duyệt nội dung do Creator gửi",
  CREATOR:      "Tạo nháp nội dung và gửi để kiểm duyệt",
  STUDENT:      "Xem nội dung đã được phê duyệt, tải tài liệu, xem video",
  PENDING_USER: "Đăng ký mới, chờ Admin phê duyệt để truy cập portal",
};

export function canEdit(role: Role): boolean {
  return ["SUPER_ADMIN", "ADMIN", "CREATOR"].includes(role);
}

export function canAdmin(role: Role): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

// ── ContentStatus helpers ─────────────────────────────────────

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT:     "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED:  "Đã duyệt",
  REJECTED:  "Bị từ chối",
  PUBLISHED: "Đã đăng",
  ARCHIVED:  "Lưu trữ",
};

export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT:     "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED:  "bg-blue-100 text-blue-700",
  REJECTED:  "bg-red-100 text-red-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED:  "bg-slate-100 text-slate-500",
};

// ── Tag helpers ───────────────────────────────────────────────

export const TAG_LABELS: Record<string, string> = {
  LICH_HOC: "Lịch học",
  DEADLINE: "Deadline",
  THAY_DOI: "Thay đổi",
  THI_CU:   "Thi / KT",
  CHUNG_CHI:"Chứng chỉ",
  KHAC:     "Khác",
};

export const TAG_COLORS: Record<string, string> = {
  LICH_HOC: "bg-blue-100 text-blue-700",
  DEADLINE: "bg-amber-100 text-amber-700",
  THAY_DOI: "bg-orange-100 text-orange-700",
  THI_CU:   "bg-red-100 text-red-700",
  CHUNG_CHI:"bg-green-100 text-green-700",
  KHAC:     "bg-gray-100 text-gray-600",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASS:    "Lịch học",
  EXAM:     "Thi / KT",
  DEADLINE: "Deadline",
  EVENT:    "Sự kiện",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  CLASS:    "bg-blue-500",
  EXAM:     "bg-red-500",
  DEADLINE: "bg-amber-500",
  EVENT:    "bg-purple-500",
};

export const EVENT_TYPE_TEXT_COLORS: Record<string, string> = {
  CLASS:    "text-blue-600",
  EXAM:     "text-red-600",
  DEADLINE: "text-amber-600",
  EVENT:    "text-purple-600",
};

// ── Misc ──────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function slugifyVi(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `lesson-${Date.now().toString(36)}`;
}
