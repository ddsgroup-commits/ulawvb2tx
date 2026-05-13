# Deployment guide — ULAW VB2-TX LMS

## Prereqs

- Ubuntu 22.04+ VPS (the current Hostinger VPS works)
- Docker 24+ and Docker Compose v2
- A pointed-at-VPS domain (`ulawvb2tx.com`) with HTTPS via Caddy or Nginx + Certbot

## One-time setup

```bash
# 1. Clone & enter
cd /var/ulaw && git clone https://github.com/your-org/ulaw-lms-v2.git
cd ulaw-lms-v2

# 2. Secrets
cp .env.example .env.prod
nano .env.prod
#   - DATABASE_URL with strong password
#   - AUTH_SECRET            : openssl rand -base64 32
#   - ENCRYPTION_KEY         : openssl rand -hex 32
#   - GOOGLE_CLIENT_ID / SECRET (https://console.cloud.google.com → OAuth)
#   - GOOGLE_API_KEY (Gemini, https://aistudio.google.com)
#   - SMTP_HOST + creds (Resend, SendGrid, or Postmark)
#   - VAPID keys: docker compose run --rm app npm run vapid:keys

# 3. Create the upload directory
sudo mkdir -p /var/ulaw-uploads && sudo chown -R 1000:1000 /var/ulaw-uploads

# 4. Build & start
docker compose -f docker-compose.prod.yml up -d --build

# 5. Migrate & seed
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

## Reverse proxy (Caddy example)

```caddyfile
ulawvb2tx.com, www.ulawvb2tx.com {
    encode zstd gzip
    handle /uploads/* {
        root * /var/ulaw-uploads
        file_server
    }
    reverse_proxy app:3000
}
```

Caddy auto-issues + renews Let's Encrypt certs. Reload with `caddy reload --config /etc/caddy/Caddyfile`.

## Updates

```bash
cd /var/ulaw/ulaw-lms-v2
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

## Backups

Minimum nightly:

```bash
# /etc/cron.daily/ulaw-backup
docker compose -f /var/ulaw/ulaw-lms-v2/docker-compose.prod.yml \
  exec -T db pg_dump -U ulaw ulaw_lms | \
  gzip > /var/backups/ulaw/db-$(date +%F).sql.gz
tar czf /var/backups/ulaw/uploads-$(date +%F).tgz /var/ulaw-uploads
find /var/backups/ulaw -mtime +30 -delete
```

Then `rclone copy /var/backups/ulaw remote:ulaw-backups` to off-VPS storage.

## Health checks

- `GET /api/dashboard` — returns 200 for any authenticated user
- `docker compose exec db pg_isready` — DB liveness
- Browser: open `/` (public), `/portal/dashboard` (student), `/admin` (admin)

## Common operations

| Task | Command |
|------|---------|
| Tail app logs | `docker compose -f docker-compose.prod.yml logs -f app` |
| Open Prisma Studio (DB) | `docker compose exec app npm run db:studio` |
| Reset a user's password | SQL: `UPDATE users SET "passwordHash" = $1 WHERE email=$2` (hash with bcrypt rounds=12) |
| Send test push | `curl /api/admin/push/test` (admin only — Phase 5) |
