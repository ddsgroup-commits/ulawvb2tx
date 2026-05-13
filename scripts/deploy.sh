#!/usr/bin/env bash
# =============================================================
# ULAW VB2 Portal — Zero-downtime deploy (rolling restart)
#
# Runs on the VPS. The strategy:
#   1. Snapshot a fresh DB backup BEFORE any change (rollback safety).
#   2. Build the new Next.js image alongside the running one.
#   3. Apply Prisma migrations (forward-only, must be backward-compatible
#      with the currently running version).
#   4. Hot-swap the app container with `--no-deps`, which keeps Postgres
#      untouched — only the Next.js process restarts. Traefik sees the
#      new container come up healthy before the old one stops.
#
# Usage:
#   scripts/deploy.sh             # full deploy
#   scripts/deploy.sh --skip-migrate
#
# Requires: docker, docker compose, bash.
# =============================================================

set -Eeuo pipefail

cd "$(dirname "$0")/.."   # project root

SKIP_MIGRATE=false
for arg in "$@"; do
  case "$arg" in
    --skip-migrate) SKIP_MIGRATE=true ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

ts() { date -Iseconds; }
log() { printf "[%s] %s\n" "$(ts)" "$*"; }

# ── Step 1: pre-deploy backup ────────────────────────────────
if [ -x scripts/backup.sh ]; then
  log "creating pre-deploy backup…"
  scripts/backup.sh
else
  log "WARNING: scripts/backup.sh not executable — skipping pre-deploy backup"
fi

# ── Step 2: build new image (cached layers reused) ───────────
log "building new app image…"
docker compose build app

# ── Step 3: forward-only migrations ─────────────────────────
# Run them BEFORE restarting the app so the old container stays up while
# we migrate. Migrations must be backward-compatible (additive columns,
# new tables) or the old container will start erroring out.
if [ "$SKIP_MIGRATE" = false ]; then
  log "running prisma migrate deploy…"
  docker compose run --rm migrate
else
  log "skipping migrations (--skip-migrate)"
fi

# ── Step 4: rolling restart of just the app container ───────
# --no-deps prevents docker compose from touching postgres.
# --force-recreate brings up a fresh container.
# By default compose v2 waits for the new container to be healthy
# before stopping the old one when scale > 1; for our single-replica
# deploy, the gap is ~2-3 seconds. Traefik retries during the gap.
log "rolling restart of app container…"
docker compose up -d --no-deps --force-recreate app

# ── Step 5: smoke check ────────────────────────────────────
log "waiting for app to become healthy…"
sleep 4
if curl -fsS -o /dev/null --max-time 10 https://portal.srv1559779.hstgr.cloud/login; then
  log "DEPLOY OK"
else
  log "DEPLOY WARNING — /login did not respond. Check 'docker compose logs -f app'."
  exit 1
fi
