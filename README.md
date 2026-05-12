# ULAW VB2 Portal — Enterprise Academic ERP + LMS

**Production-grade Academic ERP + Learning Management System for the VB2 Remote Law Class, Ho Chi Minh City University of Law (ULAW).**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| ORM | Prisma 5 + PostgreSQL 16 |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| Containers | Docker + Docker Compose |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Dates | date-fns |

---

## RBAC Roles

| Role | Vietnamese | Permissions |
|------|-----------|------------|
| `SUPER_ADMIN` | Quản trị cao nhất | Full system access, delete users |
| `ADMIN` | Quản trị viên | Manage content, users, settings |
| `EDITOR` | Biên tập viên | Create/edit announcements, events, library |
| `LECTURER` | Giảng viên | View content, manage own course |
| `MEMBER` | Thành viên lớp | View all portal content |
| `GUEST` | Khách | Read-only access |

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone & configure environment
cp .env.example .env.local

# 2. Generate NEXTAUTH_SECRET (required)
openssl rand -base64 32
# Paste result into NEXTAUTH_SECRET in .env.local

# 3. Start all services (PostgreSQL + Next.js app)
docker compose up -d

# 4. Run DB migrations + seed sample data
docker compose run --rm migrate

# 5. Open browser
open http://localhost:3000
```

### Login Credentials (after seeding)

Every student in the class roster (175 entries) is created automatically.

| Field | Value |
|-------|-------|
| Username | MSSV (Mã số sinh viên, 13 digits) |
| Password | Vietnamese first name, lowercased, diacritics removed |

**Admin accounts** (full admin panel access):

| MSSV | Name | Password |
|------|------|---------:|
| `2543801010228` | Trần Nguyễn Anh Linh | `linh` |
| `2543801010147` | Phạm Hoàng Thanh Thảo | `thao` |

All other 173 students are seeded with role `MEMBER` (viewer). Every account is flagged `mustChangePassword: true` so the portal can prompt for a password reset on first login (the reset UI is part of Phase 2).

> The default passwords are derived deterministically from each student's first name. To re-hash every account back to its default (e.g. after a roster sync), run:
> ```bash
> SEED_RESET_PASSWORDS=true npm run db:seed
> ```
> Without that flag, the seed preserves passwords that students may have changed.

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker Desktop)
- npm

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL only via Docker
docker compose up postgres -d

# 3. Configure environment
cp .env.example .env.local
# Edit DATABASE_URL and NEXTAUTH_SECRET

# 4. Run migrations & seed
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
```

Open **http://localhost:3000**

---

## Database Commands

```bash
npm run db:generate    # Regenerate Prisma client after schema changes
npm run db:migrate     # Create + apply migration (dev)
npm run db:deploy      # Apply migrations in production
npm run db:seed        # Seed sample data
npm run db:studio      # Open Prisma Studio GUI
npm run db:reset       # Reset DB + reseed (dev only — DESTRUCTIVE)
```

---

## Project Structure

```
ulaw-vb2-portal/
├── prisma/
│   ├── schema.prisma          # All DB models + enums
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/         # Login page (credentials + Google)
│   │   ├── (portal)/          # Student portal — requires login
│   │   │   ├── layout.tsx     # Sidebar + topbar shell
│   │   │   ├── dashboard/     # Stats cards + announcements + events
│   │   │   ├── announcements/ # Search + tag filter + accordion view
│   │   │   ├── schedule/      # Monthly calendar grid + deadline list
│   │   │   ├── courses/       # Course cards + NotebookLM + Drive links
│   │   │   ├── library/       # 3-category searchable document library
│   │   │   ├── contacts/      # BCS cards + study group directory
│   │   │   └── faq/           # FAQ accordion grouped by category
│   │   ├── (admin)/admin/     # Admin panel — ADMIN+ only
│   │   │   ├── page.tsx       # System stats + audit log
│   │   │   ├── announcements/ # CRUD + pin/urgent toggles
│   │   │   ├── events/        # CRUD calendar events
│   │   │   ├── users/         # User management + role assignment
│   │   │   └── settings/      # Site config (class info, external links)
│   │   ├── api/               # REST API routes (all role-guarded)
│   │   │   ├── auth/          # NextAuth route handler
│   │   │   ├── announcements/ # GET list (paginated+filter), POST, PATCH, DELETE
│   │   │   ├── events/        # GET (month filter), POST, PATCH, DELETE
│   │   │   ├── courses/       # GET all, PATCH
│   │   │   ├── library/       # GET (search+category), POST, DELETE, POST /:id (download++)
│   │   │   ├── faq/           # GET (grouped), POST, DELETE
│   │   │   ├── users/         # GET (paginated), POST, PATCH, DELETE
│   │   │   └── config/        # GET/POST site config
│   │   ├── globals.css        # Tailwind + component layer
│   │   └── layout.tsx         # Root layout + SessionProvider
│   ├── components/
│   │   ├── ui/                # Button, Input, Select, Badge, Modal
│   │   ├── layout/            # PortalSidebar, PortalTopbar
│   │   └── providers/         # NextAuth SessionProvider wrapper
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config (credentials + Google)
│   │   ├── prisma.ts          # Prisma singleton (dev HMR safe)
│   │   └── utils.ts           # cn(), formatDateVi(), role/tag helpers
│   ├── types/index.ts         # TypeScript DTOs for all entities
│   └── middleware.ts          # Route protection by role
├── .env.example               # All environment variables documented
├── .gitignore
├── Dockerfile                 # Multi-stage build
├── docker-compose.yml         # postgres + app + migrate services
├── next.config.ts
├── tailwind.config.ts         # ULAW brand colors + design tokens
├── tsconfig.json
└── package.json
```

---

## Database Schema

The Prisma schema includes these models:

| Model | Description |
|-------|-------------|
| `User` | Authentication + RBAC role |
| `Account` / `Session` | NextAuth adapter tables |
| `Announcement` | Class notices with tag, pin, urgent |
| `Event` | Calendar events (class/exam/deadline/event) |
| `Course` | 6 law subjects with NotebookLM + Drive links |
| `LibraryItem` | Legal docs, textbooks, past exams |
| `FAQ` | Grouped Q&A accordion |
| `Contact` | BCS + study group directory |
| `Attendance` | Per-user per-event attendance tracking |
| `Assignment` | Course assignments with due dates |
| `Submission` | Student submission tracking |
| `AuditLog` | Admin action audit trail |
| `SiteConfig` | Key-value site configuration |
| `Video` | Lecture / class videos (YouTube + Drive embed) |
| `Lesson` | LMS unit within a course (video + reading + attachments) |
| `LessonProgress` | Per-student per-lesson completion + watch time |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32-byte base64 (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | App base URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `ADMIN_EMAIL` | Optional | Bootstrap admin email (used in seed) |
| `ADMIN_PASSWORD` | Optional | Bootstrap admin password (used in seed) |

---

## Seed Data (included after `npm run db:seed`)

- **175 class roster users** from `prisma/class-roster.ts` — 2 admins + 173 members. Username = MSSV, password = first name (lowercased, no diacritics), stored as bcrypt cost-10 hashes.
- **6 courses**: Lý luận NN&PL, Hiến pháp, Hành chính, Dân sự, Logic, Lý luận PL
- **8 sample lessons** across Luật Dân sự (5) + Luật Hiến pháp (3) so the LMS flow is immediately demoable
- **4 announcements**: mix of pinned, urgent, tagged examples (incl. Video Library launch notice)
- **10 calendar events**: classes, exams, deadlines across May–June 2026
- **10 library items**: legal documents, textbooks, past exams
- **7 FAQ items** in 3 categories (login + study + grading)
- **Site config**: class name, semester, contact email, external links

> Re-running `db:seed` is **idempotent**. Users are upserted by `studentId`, courses by `slug`, configs by `key`. Demo content (announcements/events/library/faq) is only inserted when the table is empty, so the seed is safe in production after launch.

### Updating the class roster

The roster is checked in at [`prisma/class-roster.ts`](prisma/class-roster.ts). To add or remove students:

1. Edit `class-roster.ts` (preserve the `studentId` of existing users; the seed matches by that key).
2. Run `npm run db:seed` — new students are created, existing ones get name/role/status updates.
3. To force-reset passwords back to defaults: `SEED_RESET_PASSWORDS=true npm run db:seed`.

---

## Production Deployment

### Docker Compose (recommended)

```bash
# Set production secrets
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://your-domain.com"
export ADMIN_PASSWORD="YourSecurePassword123!"

# Pull & start
docker compose pull
docker compose up -d
docker compose run --rm migrate
```

### VPS / Cloud (Render, Railway, Fly.io)

1. Push to GitHub
2. Connect repo to platform
3. Set all environment variables
4. Platform auto-detects Dockerfile
5. Set start command: `node server.js`
6. Run migrate as a one-off job before deploy

### add `output: "standalone"` to next.config.ts for smaller Docker image

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  // ...
};
```

---

## Development Roadmap

### Phase 1 ✅ — Core Portal
- MSSV-based authentication (credentials + optional Google OAuth)
- 6 RBAC roles with middleware protection
- Class roster seed (175 students, 2 admins) from `class-roster.ts`
- Portal pages: dashboard, announcements, schedule, courses, **course detail + lessons**, **video library**, library, contacts, FAQ
- Admin panel: announcements, events, courses, **lessons (LMS)**, **videos**, library, users, FAQ, audit, settings
- **E-learning (LMS)**: ordered lessons per course, YouTube/Drive embedded video, attachments, mark-complete, watch-time tracking, per-student progress bars, "Continue Learning" + "Course Progress" cards on the dashboard
- Video Library: YouTube / Google Drive embeds, search by subject + tag, dashboard "recent videos" card
- Docker deployment setup

### Phase 2 — Enhanced Features
- [ ] Force-password-reset flow on first login (model flag is already in place)
- [ ] Attendance tracking UI
- [ ] Assignment submission portal
- [ ] NotebookLM embedded viewer
- [ ] Email notifications (Resend / Nodemailer)
- [ ] Google Calendar sync
- [ ] Mobile push notifications (PWA)

### Phase 3 — Advanced
- [ ] AI Study Assistant (Claude API integration)
- [ ] Analytics dashboard (charts, engagement metrics)
- [ ] Bulk user import (CSV)
- [ ] Google Drive file picker integration
- [ ] Multi-language support (vi/en)

---

*Built for ULAW VB2 Remote Law Class — Học kỳ I 2026*
*Ho Chi Minh City University of Law*
