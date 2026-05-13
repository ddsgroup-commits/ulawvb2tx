#!/usr/bin/env bash
# =============================================================
# ULAW VB2 Portal — Push from Mac + deploy on VPS
#
# Run from your Mac, inside the ulaw-vb2-portal/ directory.
# Defaults to root@portal.srv1559779.hstgr.cloud:/opt/ulaw-vb2-portal.
#
# Usage:
#   scripts/push-and-deploy.sh
#   SSH_USER=user SSH_HOST=other.host TARGET_DIR=/srv/portal scripts/push-and-deploy.sh
#   scripts/push-and-deploy.sh --first-time    # for the very first deploy
#   scripts/push-and-deploy.sh --no-deploy     # only sync files, skip remote deploy
# =============================================================

set -Eeuo pipefail

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-portal.srv1559779.hstgr.cloud}"
TARGET_DIR="${TARGET_DIR:-/opt/ulaw-vb2-portal}"

FIRST_TIME=false
SKIP_DEPLOY=false
for arg in "$@"; do
  case "$arg" in
    --first-time) FIRST_TIME=true ;;
    --no-deploy)  SKIP_DEPLOY=true ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."

echo "→ Project root: $(pwd)"
echo "→ Pushing to:   ${SSH_USER}@${SSH_HOST}:${TARGET_DIR}/"
echo

# ── Step 1: rsync the project (no node_modules / .next / .DS_Store) ──
echo "[rsync] syncing files…"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .DS_Store \
  --exclude .env \
  --exclude .env.local \
  --exclude '*.log' \
  ./ "${SSH_USER}@${SSH_HOST}:${TARGET_DIR}/"

if [ "$SKIP_DEPLOY" = true ]; then
  echo
  echo "✅ Files synced. (--no-deploy specified — skipping remote deploy.)"
  exit 0
fi

# ── Step 2: trigger remote deploy ──
if [ "$FIRST_TIME" = true ]; then
  echo
  echo "[remote] First-time bootstrap — building images, starting services, running initial seed…"
  ssh "${SSH_USER}@${SSH_HOST}" "bash -se" <<EOF
set -Eeuo pipefail
cd "${TARGET_DIR}"
chmod +x scripts/*.sh

# Bring up postgres first; wait for it to be healthy.
docker compose up -d postgres
echo "Waiting 10s for Postgres to be healthy…"
sleep 10

# Build all images.
docker compose build app migrate

# Apply schema + seed roster (this is the FIRST seed — creates all 175 users).
docker compose run --rm migrate

# Start the app + the daily backup service.
docker compose up -d app backup

# Smoke check.
sleep 5
echo "Smoke checking https://${SSH_HOST}/login …"
curl -sS -o /dev/null -w "HTTP %{http_code}\\n" --max-time 15 "https://${SSH_HOST}/login" || true
EOF
else
  echo
  echo "[remote] Rolling deploy (zero-downtime)…"
  ssh "${SSH_USER}@${SSH_HOST}" "bash -se" <<EOF
set -Eeuo pipefail
cd "${TARGET_DIR}"
chmod +x scripts/*.sh
./scripts/deploy.sh
EOF
fi

echo
echo "✅ Done. Open https://${SSH_HOST}/login"
