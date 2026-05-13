-- ============================================================
-- Phase 2 schema upgrade: notifications, quizzes, attendance,
-- lesson progress, AI sessions.
-- ============================================================

-- ── New enums ──
CREATE TYPE "NotificationType" AS ENUM (
  'ANNOUNCEMENT','ASSIGNMENT_DUE','ASSIGNMENT_GRADED','QUIZ_AVAILABLE',
  'QUIZ_GRADED','CLASS_REMINDER','EXAM_REMINDER','FORUM_REPLY','FORUM_MENTION',
  'CONTENT_APPROVED','CONTENT_REJECTED','ATTENDANCE_OPENED','SYSTEM'
);

CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP','EMAIL','PUSH');

CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE','EXCUSED');

CREATE TYPE "QuestionType" AS ENUM ('MCQ_SINGLE','MCQ_MULTI','TRUE_FALSE','ESSAY');

-- Extend AuditAction enum (Postgres can't add multiple values in one stmt before pg12)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_PASSWORD_RESET';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_GRADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'QUIZ_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ATTENDANCE_RECORDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOTIFICATION_SENT';

-- ── User extensions ──
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'vi',
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- ── notifications ──
CREATE TABLE "notifications" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT,
  "link"      TEXT,
  "entity"    TEXT,
  "entityId"  TEXT,
  "read"      BOOLEAN NOT NULL DEFAULT FALSE,
  "readAt"    TIMESTAMP(3),
  "channels"  "NotificationChannel"[] DEFAULT ARRAY[]::"NotificationChannel"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "notifications_user_read_idx"      ON "notifications"("userId","read");
CREATE INDEX "notifications_user_createdAt_idx" ON "notifications"("userId","createdAt");

-- ── notification_preferences ──
CREATE TABLE "notification_preferences" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "emailEnabled"    BOOLEAN NOT NULL DEFAULT TRUE,
  "pushEnabled"     BOOLEAN NOT NULL DEFAULT TRUE,
  "digestFrequency" TEXT NOT NULL DEFAULT 'INSTANT',
  "channels"        JSONB NOT NULL DEFAULT '{"announcements":true,"assignments":true,"grades":true,"forum":true,"calendar":true}',
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── push_subscriptions ──
CREATE TABLE "push_subscriptions" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint"  TEXT NOT NULL UNIQUE,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "userAgent" TEXT,
  "lastUsed"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- ── quizzes ──
CREATE TABLE "quizzes" (
  "id"               TEXT PRIMARY KEY,
  "courseId"         TEXT NOT NULL REFERENCES "courses"("id"),
  "title"            TEXT NOT NULL,
  "description"      TEXT,
  "timeLimitMin"     INTEGER,
  "passingScore"     INTEGER NOT NULL DEFAULT 60,
  "maxAttempts"      INTEGER NOT NULL DEFAULT 1,
  "shuffleQuestions" BOOLEAN NOT NULL DEFAULT FALSE,
  "isPublished"      BOOLEAN NOT NULL DEFAULT FALSE,
  "opensAt"          TIMESTAMP(3),
  "closesAt"         TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "quizzes_courseId_idx" ON "quizzes"("courseId");

CREATE TABLE "quiz_questions" (
  "id"             TEXT PRIMARY KEY,
  "quizId"         TEXT NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "order"          INTEGER NOT NULL DEFAULT 0,
  "type"           "QuestionType" NOT NULL,
  "prompt"         TEXT NOT NULL,
  "options"        JSONB,
  "correctAnswers" JSONB NOT NULL,
  "points"         DOUBLE PRECISION NOT NULL DEFAULT 1,
  "explanation"    TEXT
);
CREATE INDEX "quiz_questions_quizId_idx" ON "quiz_questions"("quizId");

CREATE TABLE "quiz_attempts" (
  "id"          TEXT PRIMARY KEY,
  "quizId"      TEXT NOT NULL REFERENCES "quizzes"("id"),
  "studentId"   TEXT NOT NULL REFERENCES "users"("id"),
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "answers"     JSONB NOT NULL,
  "score"       DOUBLE PRECISION,
  "passed"      BOOLEAN,
  "durationSec" INTEGER
);
CREATE INDEX "quiz_attempts_quiz_student_idx" ON "quiz_attempts"("quizId","studentId");

-- ── attendance ──
CREATE TABLE "attendance_sessions" (
  "id"          TEXT PRIMARY KEY,
  "courseId"    TEXT NOT NULL REFERENCES "courses"("id"),
  "title"       TEXT NOT NULL,
  "sessionDate" TIMESTAMP(3) NOT NULL,
  "durationMin" INTEGER NOT NULL DEFAULT 120,
  "formUrl"     TEXT,
  "notes"       TEXT,
  "isClosed"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "attendance_sessions_course_date_idx" ON "attendance_sessions"("courseId","sessionDate");

CREATE TABLE "attendance_records" (
  "id"         TEXT PRIMARY KEY,
  "sessionId"  TEXT NOT NULL REFERENCES "attendance_sessions"("id") ON DELETE CASCADE,
  "studentId"  TEXT NOT NULL REFERENCES "users"("id"),
  "status"     "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
  "note"       TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("sessionId","studentId")
);
CREATE INDEX "attendance_records_student_idx" ON "attendance_records"("studentId");

-- ── lesson_progress ──
CREATE TABLE "lesson_progress" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "lessonId"    TEXT NOT NULL,
  "progressPct" INTEGER NOT NULL DEFAULT 0,
  "positionSec" INTEGER NOT NULL DEFAULT 0,
  "completed"   BOOLEAN NOT NULL DEFAULT FALSE,
  "completedAt" TIMESTAMP(3),
  "lastSeenAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId","lessonId")
);
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");

-- ── ai_sessions ──
CREATE TABLE "ai_sessions" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title"      TEXT NOT NULL DEFAULT 'Cuộc trò chuyện mới',
  "courseId"   TEXT,
  "promptType" TEXT,
  "messages"   JSONB NOT NULL,
  "pinned"     BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ai_sessions_userId_idx" ON "ai_sessions"("userId");
