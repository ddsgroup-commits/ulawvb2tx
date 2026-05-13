import type { Role, AnnouncementTag, EventType, LibraryCategory, CourseStatus } from "@prisma/client";

// ── Re-export Prisma enums for use in client components ──────
export type { Role, AnnouncementTag, EventType, LibraryCategory, CourseStatus };

// ── Extended Session ─────────────────────────────────────────
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}

// ── API Response wrappers ─────────────────────────────────────
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  status?: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ── Announcement ─────────────────────────────────────────────
export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  tag: AnnouncementTag;
  author: { id: string; name: string | null };
  pinned: boolean;
  urgent: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Event ─────────────────────────────────────────────────────
export interface EventDto {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: EventType;
  time?: string;
  room?: string;
  description?: string;
  courseId?: string;
  course?: { name: string; slug: string } | null;
}

// ── Course ───────────────────────────────────────────────────
export interface CourseDto {
  id: string;
  slug: string;
  code: string;
  name: string;
  credits: number;
  icon?: string | null;
  description?: string | null;
  lecturer?: { id: string; name: string | null } | null;
  notebooklmUrl?: string | null;
  driveUrl?: string | null;
  status: CourseStatus;
  order: number;
}

// ── Library ──────────────────────────────────────────────────
export interface LibraryItemDto {
  id: string;
  title: string;
  category: LibraryCategory;
  description?: string | null;
  fileUrl?: string | null;
  driveId?: string | null;
  course?: { name: string; slug: string } | null;
  downloadCount: number;
  createdAt: string;
}

// ── FAQ ──────────────────────────────────────────────────────
export interface FaqItemDto {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

export interface FaqGroupDto {
  category: string;
  items: FaqItemDto[];
}

// ── Contact ──────────────────────────────────────────────────
export interface ContactDto {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  groupName?: string | null;
  note?: string | null;
}

// ── Pagination ───────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Stats for Dashboard ───────────────────────────────────────
export interface DashboardStats {
  newAnnouncementsCount: number;
  upcomingEventsThisWeek: number;
  nextDeadlineDaysLeft: number | null;
  nextDeadlineTitle: string | null;
  activeCourses: number;
}
