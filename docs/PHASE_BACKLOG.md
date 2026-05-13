# Phase backlog — what's left after v2.1

This file is the punch list of work intentionally deferred from the v2.1
foundation upgrade. Each section lists the **outcome**, the **files to
create/modify**, and the **schema** if any.

## P1 — Critical to ship Canvas-grade student experience

### 1. File uploads for assignments & library
- **Where:** add `lib/uploads.ts` (multipart parse → `UPLOAD_DIR`, virus scan stub, mime/size validation)
- **API:** `POST /api/uploads` returns `{ url }`
- **Route nginx:** `location /uploads/ { … }` for static serving
- **Replace:** "Tải file lên (Phase 4)" disabled button in `assignments/[id]/_components/submit-form.tsx`

### 2. Admin CRUD parity
Replicate the **`/admin/announcements`** pattern (server list + `<Dialog>` form + `apiHandler` endpoints) for:
- `/admin/courses` — courses, modules, lessons (drag-to-reorder using @dnd-kit)
- `/admin/videos` — video CRUD + YouTube auto-thumbnail
- `/admin/library` — library items + drive picker
- `/admin/faq`
- `/admin/users` — strengthen with bulk approve, CSV import
- `/admin/settings` — SiteConfig form

### 3. Quizzes (schema already migrated)
- `/admin/quizzes/new` — multi-step builder (MCQ_SINGLE / MCQ_MULTI / TRUE_FALSE / ESSAY) using `quizCreateSchema`
- `/portal/courses/[slug]/quizzes/[id]/attempt` — timer (uses Quiz.timeLimitMin), autosave drafts every 15s
- `POST /api/quizzes/:id/attempt` — grade MCQ server-side, queue essays for lecturer review
- Notification: QUIZ_AVAILABLE on publish, QUIZ_GRADED when essay scored

### 4. Attendance (schema already migrated)
- `/admin/courses/:slug/attendance/new` — create AttendanceSession
- `/portal/courses/[slug]/attendance` — student self-view
- `/admin/attendance/[sessionId]` — class roster table with quick toggles
- CSV export endpoint

### 5. Lecturer dashboard
- `/lecturer` (CREATOR/LECTURER landing) — own courses, pending submissions to grade, student questions, upload widget

### 6. Course-enrollment table
**Schema gap:** there is currently no explicit `Enrollment` table — every published item is visible to every active user. Add:
```prisma
model Enrollment {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  cohort    String?
  status    String   @default("ACTIVE")  // ACTIVE, DROPPED, COMPLETED
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])
  joinedAt  DateTime @default(now())
  @@unique([userId, courseId])
}
```
Then gate `assignments`, `announcements (with courseId)`, `videos`, `library` by enrollment.

## P2 — Polish and analytics

### 7. Analytics dashboard (`/admin/analytics`)
- Server queries via Prisma `groupBy` → recharts on the client
- Metrics: actives 7d/30d, login frequency, course engagement, video views, downloads, assignment completion, attendance rate, top AI questions, at-risk students (no logins 14d)

### 8. Search palette (⌘K)
- Wire `command-bar.tsx` to `<CommandDialog>` (`cmdk` package)
- Server endpoint `GET /api/search?q=…` runs Postgres `to_tsvector` across announcements, courses, videos, library, users (admin only)

### 9. Forum upgrades
- Anonymous posting with approval workflow
- Upvotes
- Solved mark
- @mentions → FORUM_MENTION notification

### 10. AI Study Assistant expansion
- Persist sessions to `AiSession` (already migrated)
- Course-context selector — passes course slug to system prompt
- Prompt templates (already in vi.json `ai.templates`)
- NotebookLM deep-link button per course
- "Saved AI notes" panel

### 11. Quizzes/Assignments AI helpers (server)
- Per-question explanations powered by Gemini
- "Generate flashcards from this lesson" → `/api/ai/flashcards`

## P3 — Operational / nice-to-have

### 12. SSE/WebSocket for real-time notifications
Replace the 60s poll in `notification-bell.tsx` with `/api/notifications/stream` (Server-Sent Events).

### 13. Email digest job
`scripts/send-digest.ts` cron — aggregates the day's unread notifications per user respecting `digestFrequency`.

### 14. Backup script
`scripts/backup.ts` — pg_dump → encrypted tar → S3/Drive.

### 15. Build-error cleanup
Remove `ignoreBuildErrors` + `ignoreDuringBuilds` from `next.config.ts`. Currently kept on because some pre-existing pages still drift from the latest Prisma schema (commented in next.config.ts).

### 16. E2E tests
- Playwright suite for: sign-in, submit assignment, post announcement → notification arrives, change role
- Lighthouse CI ≥ 90 for landing + dashboard

### 17. Replace PWA icons
`public/icons/icon-{192,256,384,512}.png` are placeholders. Replace with finalized brand assets.

### 18. Multilingual content completion
zh.json and ko.json are scaffolded — finish translations or commission them.

---

**Status as of 2026-05-13:** Phase 2 foundation 100 % complete (build hygiene, design system, layout shells, i18n, validation, security, schema extensions, notifications, PWA). Phase 3-4 representative flows (assignment student journey, notification preferences, admin announcement CRUD, audit log viewer) built as canonical patterns. Phases 4-6 remaining work tracked above.
