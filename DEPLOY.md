# Deployment Guide — ULAW VB2 Portal

This guide covers two paths:

1. **Production deploy** to your Hostinger VPS at `portal.srv1559779.hstgr.cloud` (Docker + Traefik).
2. **Local testing** on macOS without Docker, using a managed Postgres (Neon/Supabase/Railway free tier).

The portal includes the LMS / E-learning module out of the box — once seeded, students can sign in with their MSSV, see their course progress, watch lectures, and mark lessons complete.

---

## 1. Production deploy (Hostinger VPS)

> Assumes Docker + Docker Compose are already installed on the VPS, and Traefik is the reverse proxy (this is consistent with `portal.srv1559779.hstgr.cloud` already being routable).

### 1.1 Copy the project to the VPS

From your Mac:

```bash
# From: /Users/MAC/Documents/Claude/Projects/Law School ULAW HCM/ULAW Website Project
cd "/Users/MAC/Documents/Claude/Projects/Law School ULAW HCM/ULAW Website Project"

# Replace srv1559779 / user / path with your real VPS coordinates:
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .DS_Store \
  ulaw-vb2-portal/ root@portal.srv1559779.hstgr.cloud:/opt/ulaw-vb2-portal/
```

### 1.2 Set environment variables on the VPS

```bash
ssh root@portal.srv1559779.hstgr.cloud
cd /opt/ulaw-vb2-portal

# Create .env (sibling of docker-compose.yml). The compose file reads these.
cat > .env <<EOF
NEXTAUTH_URL=https://portal.srv1559779.hstgr.cloud
NEXTAUTH_SECRET=$(openssl rand -base64 32)
# Optional Google OAuth — leave empty to disable:
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EOF

chmod 600 .env
```

### 1.3 Build, migrate, and start

```bash
# Build the Next.js image
docker compose build app migrate

# Bring up Postgres first
docker compose up -d postgres

# Wait a few seconds for the healthcheck to pass, then run migrations + seed.
# The `migrate` service runs `prisma migrate deploy && tsx prisma/seed.ts`.
docker compose run --rm migrate

# Bring up the app
docker compose up -d app
```

### 1.4 Verify

- Visit `https://portal.srv1559779.hstgr.cloud/login` — you should see the new MSSV login screen with the red top accent.
- Sign in with `2543801010228` / `linh` (admin) and check:
  - Dashboard shows the "Continue Learning" card (after viewing one lesson) and "Course Progress" tiles.
  - `/courses` shows progress bars per course.
  - `/courses/dan-su` lists the 5 sample lessons.
  - `/admin/lessons` lets you add new lessons.
  - `/admin/videos` lets you add video lectures.

### 1.5 Subsequent deploys (zero-downtime, after code changes)

Use the helper script — it snapshots a backup, builds the new image, applies migrations *before* swapping the app, then does a rolling restart so Traefik never sees both containers down:

```bash
# On your Mac, push code:
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .DS_Store \
  ulaw-vb2-portal/ root@portal.srv1559779.hstgr.cloud:/opt/ulaw-vb2-portal/

# On the VPS:
cd /opt/ulaw-vb2-portal
chmod +x scripts/*.sh   # first time only
./scripts/deploy.sh
```

What `deploy.sh` does:

1. `scripts/backup.sh` — pre-deploy DB snapshot (rollback safety).
2. `docker compose build app` — builds the new image alongside the running one.
3. `docker compose run --rm migrate` — applies `prisma migrate deploy` against the live DB **before** swapping (migrations must be backward-compatible so the old container survives until step 4 — add nullable columns first, change schema in two deploys when needed).
4. `docker compose up -d --no-deps --force-recreate app` — recreates only the app container. Postgres + backup service stay up. Traefik retries the ~2-3s gap.
5. `curl` smoke check against `/login`.

If you didn't touch the schema, pass `--skip-migrate`:

```bash
./scripts/deploy.sh --skip-migrate
```

---

## 1.6 Backups (automatic + manual)

A `backup` service is built into `docker-compose.yml`. After `docker compose up -d`, it sleeps until 02:00 server time, runs `pg_dump`, gzip-compresses to `/var/backups/ulaw-portal/ulaw_portal_<timestamp>.sql.gz`, and prunes files older than 30 days.

**Manual backup right now:**

```bash
./scripts/backup.sh
ls -lh /var/backups/ulaw-portal/
```

**Restore the latest backup** (will stop the app briefly, restore, restart):

```bash
./scripts/restore.sh
```

**Restore a specific snapshot:**

```bash
./scripts/restore.sh /var/backups/ulaw-portal/ulaw_portal_2026-05-12_02-00.sql.gz
```

**Copy backups off the VPS** (recommended weekly — to your Mac):

```bash
# Run from your Mac:
mkdir -p ~/Documents/ULAW-backups
rsync -avz root@portal.srv1559779.hstgr.cloud:/var/backups/ulaw-portal/ ~/Documents/ULAW-backups/
```

**Watch the backup service:**

```bash
docker compose logs -f backup
```

If you want a different backup time, edit the `today02` line inside `docker-compose.yml`'s `backup` service.

---

## 2. Local testing on macOS (no Docker)

Brew is reporting an internal error on your machine right now, so installing Postgres locally with `brew install postgresql@16` may not work immediately. The fastest workaround is a free cloud Postgres:

### Option A — Neon (recommended, free, instant)

1. Sign up at https://neon.tech and create a new project. Region: closest to Vietnam (Singapore).
2. Copy the connection string — it looks like:
   `postgresql://username:password@ep-cool-name.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. On your Mac:

```bash
cd "/Users/MAC/Documents/Claude/Projects/Law School ULAW HCM/ULAW Website Project/ulaw-vb2-portal"

cat > .env.local <<EOF
DATABASE_URL="postgresql://<user>:<pass>@<host>/<db>?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF

# Already done earlier, but safe to re-run:
npx prisma migrate dev --name init_lms_video
npm run db:seed
npm run dev
```

Open http://localhost:3000 and log in with any MSSV from the roster.

### Option B — Fix Homebrew and install Postgres locally

The earlier `brew search` failed with a Ruby error inside Homebrew. Run:

```bash
brew update --auto-update
brew doctor
# If still broken, reset Homebrew:
brew update-reset
```

Then:

```bash
brew install postgresql@16
brew services start postgresql@16

# Create the DB + user
psql postgres <<'SQL'
CREATE USER ulaw_user WITH PASSWORD 'ulaw_pass';
CREATE DATABASE ulaw_portal OWNER ulaw_user;
GRANT ALL PRIVILEGES ON DATABASE ulaw_portal TO ulaw_user;
SQL

# .env.local with localhost
cat > .env.local <<EOF
DATABASE_URL="postgresql://ulaw_user:ulaw_pass@localhost:5432/ulaw_portal?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF

npx prisma migrate dev --name init_lms_video
npm run db:seed
npm run dev
```

---

## 3. What the migration does

Running `prisma migrate dev` (or `migrate deploy` in prod) on the current schema will create:

- `User.mustChangePassword` column (boolean, default `false`)
- `User.studentId` index
- New `Video` table + `VideoSource`/`VideoStatus` enums
- New `Lesson` table + `LessonStatus`/`LessonType` enums
- New `LessonProgress` table (per-user per-lesson completion + watch time)
- Foreign keys + indexes

The migration is non-destructive on existing rows. After it runs, `npm run db:seed` populates the 175-student roster + the 8 sample lessons.

---

## 4. Common operations

### Re-seed everyone's password back to the default (e.g. after roster sync)

```bash
SEED_RESET_PASSWORDS=true npm run db:seed
# Or on the VPS:
docker compose run --rm -e SEED_RESET_PASSWORDS=true migrate
```

### Add a new lesson

1. Sign in as admin (`2543801010228` / `linh` or `2543801010147` / `thao`).
2. Go to `/admin/lessons`.
3. Click **Thêm bài học** → choose course, paste a YouTube/Drive URL, fill in title + content → Save.

### Add a video to the Video Library

1. Sign in as admin.
2. Go to `/admin/videos`.
3. Click **Thêm video** → paste URL → Save.

### Promote a student to admin

In Prisma Studio (`npm run db:studio`) or via SQL:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE "studentId" = '<MSSV>';
```

### Reset a student's password

```sql
-- They will then need to log in with the default ("first name lowercased no diacritics")
-- after you run SEED_RESET_PASSWORDS=true npm run db:seed.
```

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `next-auth/jwt cannot be found` TS warning during dev | TS module resolution quirk, not a runtime issue | Ignore — `next build` has `ignoreBuildErrors: true` |
| `prisma generate` complains about `DATABASE_URL` not set | Running outside of `.env.local` scope | Run with `DATABASE_URL=… npx prisma generate` or use `npm run db:generate` |
| Student logs in but sees no lessons | Sample seed only created lessons for Dân sự + Hiến pháp | Add lessons in `/admin/lessons` |
| Login succeeds but dashboard says "no admin" | Roster mapping issue | Check `prisma/class-roster.ts` — MSSVs `…0147` and `…0228` must have `role: "admin"` |
| Container can't reach Postgres on the VPS | Docker network not initialized | `docker compose up -d postgres` then wait 10s before `app` |

---

## 6. After the launch — recommended hardening

1. **Force-password-reset on first login** — the `User.mustChangePassword` column already exists. Wire up a `/change-password` route gated by middleware.
2. **Rate limit `/api/auth/[...nextauth]`** — Traefik middleware or a Next.js middleware can throttle by IP.
3. **Backups** — set up a nightly `pg_dump` cron on the VPS.
4. **Logs** — pipe Next.js logs to `/var/log/ulaw-portal/` and rotate.
5. **Security audit** — Next.js 15.0.3 has CVE-2025-66478; consider `npm i next@latest` after the school launch.
