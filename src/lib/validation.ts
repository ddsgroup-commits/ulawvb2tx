/**
 * Shared Zod schemas. Imported by API routes via apiHandler({ body, query }).
 * Keeping them centralized prevents the same shape being re-declared across
 * /api routes and admin forms.
 */
import { z } from "zod";

// ── Primitives ──
export const idSchema = z.object({ id: z.string().min(1) });
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
});

// ── Announcements ──
export const announcementTagEnum = z.enum([
  "LICH_HOC", "DEADLINE", "THAY_DOI", "THI_CU", "CHUNG_CHI", "KHAC",
]);

export const announcementCreateSchema = z.object({
  title: z.string().min(3, "Tiêu đề tối thiểu 3 ký tự").max(200),
  content: z.string().min(10, "Nội dung tối thiểu 10 ký tự"),
  tag: announcementTagEnum.default("KHAC"),
  courseId: z.string().optional(),
  pinned: z.boolean().default(false),
  urgent: z.boolean().default(false),
  publishAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.partial();

// ── Assignments ──
export const submissionTypeEnum = z.enum([
  "GOOGLE_FORM", "DRIVE_FOLDER", "EXTERNAL_LINK", "PORTAL_UPLOAD",
]);

export const assignmentCreateSchema = z.object({
  title: z.string().min(3).max(200),
  instructions: z.string().min(10),
  courseId: z.string().min(1),
  dueDate: z.coerce.date(),
  submissionType: submissionTypeEnum.default("PORTAL_UPLOAD"),
  submissionUrl: z.string().url().optional().or(z.literal("")),
  maxScore: z.number().int().min(0).max(100).optional(),
  weight: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().default(false),
});

export const submissionCreateSchema = z.object({
  submitUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

// ── Events ──
export const eventTypeEnum = z.enum([
  "CLASS", "EXAM", "DEADLINE", "EVENT", "MEETING", "VIDEO_RELEASE",
]);

export const eventCreateSchema = z.object({
  title: z.string().min(3).max(200),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  type: eventTypeEnum,
  time: z.string().optional(),
  room: z.string().optional(),
  description: z.string().optional(),
  courseId: z.string().optional(),
});

// ── Library ──
export const libraryCategoryEnum = z.enum([
  "LEGAL_DOC", "TEXTBOOK", "SLIDE", "TEACHER_NOTE", "STUDENT_NOTE",
  "REFERENCE", "PAST_EXAM", "ASSIGNMENT_TPL", "AI_SUMMARY", "ADMIN_DOC",
]);

export const libraryCreateSchema = z.object({
  title: z.string().min(3).max(200),
  category: libraryCategoryEnum,
  description: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal("")),
  driveUrl: z.string().url().optional().or(z.literal("")),
  fileType: z.string().optional(),
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  courseId: z.string().optional(),
  accessLevel: z.enum(["PUBLIC", "STUDENT", "ADMIN"]).default("STUDENT"),
});

// ── Users ──
export const roleEnum = z.enum([
  "SUPER_ADMIN", "ADMIN", "MODERATOR", "CREATOR", "LECTURER", "STUDENT", "PENDING_USER",
]);

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  mssv: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  zalo: z.string().max(20).optional(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  workplace: z.string().max(200).optional(),
  jobTitle: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
});

export const privacyUpdateSchema = z.object({
  sharePhone: z.boolean().optional(),
  shareZalo: z.boolean().optional(),
  sharePersonalEmail: z.boolean().optional(),
  shareWorkplace: z.boolean().optional(),
  shareJobTitle: z.boolean().optional(),
  shareCity: z.boolean().optional(),
  shareBio: z.boolean().optional(),
  shareSocialLinks: z.boolean().optional(),
  shareAvatar: z.boolean().optional(),
});

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự")
      .regex(/[A-Z]/, "Phải có chữ HOA")
      .regex(/[a-z]/, "Phải có chữ thường")
      .regex(/[0-9]/, "Phải có số"),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirm"],
  });

// ── Quizzes ──
export const quizQuestionTypeEnum = z.enum(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE", "ESSAY"]);

export const quizCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  courseId: z.string().min(1),
  timeLimitMin: z.number().int().min(1).max(300).optional(),
  passingScore: z.number().int().min(0).max(100).default(60),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  shuffleQuestions: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        type: quizQuestionTypeEnum,
        prompt: z.string().min(3),
        options: z.array(z.string()).optional(),
        correctAnswers: z.array(z.string()),
        points: z.number().min(0).default(1),
        explanation: z.string().optional(),
      })
    )
    .min(1, "Cần ít nhất 1 câu hỏi"),
});

// ── Attendance ──
export const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export const attendanceSessionCreateSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3),
  sessionDate: z.coerce.date(),
  durationMin: z.number().int().min(15).max(480).default(120),
  formUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const attendanceRecordSchema = z.object({
  sessionId: z.string().min(1),
  studentId: z.string().min(1),
  status: attendanceStatusEnum,
  note: z.string().optional(),
});

// ── Notifications ──
export const notificationPreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  digestFrequency: z.enum(["INSTANT", "DAILY", "WEEKLY", "OFF"]).optional(),
  channels: z
    .object({
      announcements: z.boolean().optional(),
      assignments: z.boolean().optional(),
      grades: z.boolean().optional(),
      forum: z.boolean().optional(),
      calendar: z.boolean().optional(),
    })
    .optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});
