# ULAW VB2-TX LMS · v2.1

A premium, mobile-first, AI-powered Learning Management System for the **Văn bằng 2 Luật từ xa – Khoá 1** class of Ho Chi Minh City University of Law.

> **Positioning notice.** This is the official **class learning-support portal** ("Cổng học tập hỗ trợ lớp VB2-TX"). It is not the official University of Law system unless explicitly authorized. All copy on the public landing page is worded to reflect this.

**Live:** [ulawvb2tx.com](https://ulawvb2tx.com)

## What's inside

- **Next.js 15** App Router + React 18 + **TypeScript**
- **Prisma 5** + **PostgreSQL 16**
- **NextAuth v5** (credentials + Google OAuth)
- **shadcn/ui** + **Tailwind** + Radix primitives (premium burgundy/navy/gold theme)
- **next-intl** i18n: **VI** (default) · EN · ZH · KO
- **Web Push (VAPID)** + **SMTP email** + in-app notifications
- **PWA** — installable, offline fallback, mobile bottom nav, Web Push
- **Gemini 1.5 Flash** AI study assistant (with NotebookLM deep-links)
- **Role-based access control** — 7 roles, granular permission matrix
- **Audit log** for every privileged action

## Quick start

```bash
# 1. Install
npm install

# 2. Set up secrets
cp .env.example .env
# Generate AUTH_SECRET, ENCRYPTION_KEY, and (optionally) VAPID keys:
openssl rand -base64 32     # AUTH_SECRET
openssl rand -hex 32        # ENCRYPTION_KEY
npm run vapid:keys          # VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY

# 3. Database
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Dev
npm run dev      # http://localhost:3000
```

## Production (Docker)

```bash
cp .env.example .env.prod  # then fill in secrets
docker compose -f docker-compose.prod.yml up -d --build
docker compose exec app npm run db:migrate
```

The standalone Next.js output is built inside the container (~120 MB), so the VPS only needs Docker.

## Architecture

```
src/
├─ app/                       # Next.js App Router
│  ├─ (portal)/              # Student-facing portal (auth required)
│  ├─ (admin)/               # SUPER_ADMIN / ADMIN
│  ├─ (moderator)/           # MODERATOR
│  ├─ (creator)/             # CREATOR / LECTURER drafts
│  ├─ (auth)/                # Sign-in
│  ├─ (pending)/             # Approval holding area
│  ├─ api/                   # /api routes — all use apiHandler() wrapper
│  └─ page.tsx               # Public landing
├─ components/
│  ├─ ui/                    # shadcn/ui primitives
│  ├─ layout/                # Sidebar, topbar, bottom nav, command bar
│  ├─ notifications/         # Bell, push prompt
│  ├─ i18n/                  # Language switcher
│  └─ pwa/                   # Service worker registrar
├─ lib/
│  ├─ api.ts                 # apiHandler — uniform auth+zod+errors
│  ├─ auth.ts                # NextAuth config
│  ├─ permissions.ts         # RBAC matrix (source of truth)
│  ├─ validation.ts          # Centralised Zod schemas
│  ├─ notifications.ts       # Notification fan-out service
│  ├─ email.ts               # Nodemailer transport
│  ├─ push.ts                # Web Push (VAPID)
│  ├─ crypto.ts              # AES-256-GCM token encryption
│  ├─ rate-limit.ts          # In-memory token bucket
│  └─ gemini.ts              # Google Gemini client
├─ i18n/                     # next-intl config
└─ middleware.ts             # Route-to-role enforcement
messages/                    # vi.json (source), en.json, zh.json, ko.json
prisma/
├─ schema.prisma             # 28 models + 12 enums
└─ migrations/               # Sequential, deterministic
public/
├─ manifest.webmanifest      # PWA
├─ sw.js                     # Service worker (cache + push)
├─ offline.html              # Offline fallback
└─ icons/                    # PWA icons (replace with real assets)
```

## Roles & permissions

```
PENDING_USER → STUDENT → CREATOR → MODERATOR/LECTURER → ADMIN → SUPER_ADMIN
```

| Role | Can |
|------|-----|
| PENDING_USER | Only see `/pending` — awaits admin approval |
| STUDENT | View published content; submit assignments; AI assistant; bookmarks; notes; profile/privacy |
| CREATOR | Draft content, submit for review |
| LECTURER | Manage own courses; publish own course content |
| MODERATOR | Review/approve content; moderate forum |
| ADMIN | All user mgmt; all content CRUD; analytics; audit; settings |
| SUPER_ADMIN | + delete users, system settings, backups, Google integrations |

Single source of truth: [`src/lib/permissions.ts`](src/lib/permissions.ts). The `apiHandler()` wrapper enforces this declaratively for every route.

## Notifications

```
notify({ userId, type, title, body, link })
  ↓ checks NotificationPreference
  ├─ IN_APP   → row in `notifications` table (always)
  ├─ EMAIL    → SMTP via lib/email.ts (if pref.emailEnabled && SMTP_HOST)
  └─ PUSH     → Web Push to all subs (if pref.pushEnabled && VAPID keys)
```

Each channel is best-effort — flaky SMTP cannot block an announcement.

## i18n

- Source of truth: `messages/vi.json`
- Switch UI: header dropdown writes `NEXT_LOCALE` cookie
- Fallback chain: `zh`/`ko` → `en` → `vi`

## Security

- All API endpoints go through `apiHandler()` → consistent auth+RBAC+Zod
- `ENCRYPTION_KEY` encrypts CalendarSync tokens at rest
- `loginLimiter`, `aiChatLimiter`, `uploadLimiter` in `lib/rate-limit.ts`
- Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy applied in `next.config.ts`
- Audit log: every admin action writes `AuditLog`
- CSRF handled by NextAuth v5 + same-origin cookies

## Roadmap from here

See [`docs/PHASE_BACKLOG.md`](docs/PHASE_BACKLOG.md) for the punch list of what's still stubbed (assignments grading UI, quiz attempt UI, attendance UI, full admin CRUDs for the remaining entities, analytics dashboards, search palette, file uploads).

## Licensing & branding

Internal class project. Branding (logo, colors, name) is for the class only and does not imply endorsement by Ho Chi Minh City University of Law.
