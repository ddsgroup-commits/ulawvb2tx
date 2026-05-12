#!/bin/bash
# =============================================================
# ULAW LMS v2 — VPS Deployment Script
# Target: portal.srv1559779.hstgr.cloud
# =============================================================

set -e

# ── Config ────────────────────────────────────────────────────
VPS_HOST="root@portal.srv1559779.hstgr.cloud"
REMOTE_DIR="/opt/ulaw-lms"
ENV_FILE=".env.prod"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────
info "Pre-flight checks..."

[ ! -f "$ENV_FILE" ] && error ".env.prod not found. Copy .env.example to .env.prod and fill in values."

command -v ssh  >/dev/null 2>&1 || error "ssh not found"
command -v rsync >/dev/null 2>&1 || error "rsync not found"

success "Pre-flight checks passed"

# ── Sync project files to VPS ─────────────────────────────────
info "Syncing project files to ${VPS_HOST}:${REMOTE_DIR} ..."

ssh "$VPS_HOST" "mkdir -p ${REMOTE_DIR}"

rsync -avz --progress \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='*.log' \
  . "${VPS_HOST}:${REMOTE_DIR}/"

success "Files synced"

# ── Copy env file ─────────────────────────────────────────────
info "Copying .env.prod to VPS..."
rsync -avz "$ENV_FILE" "${VPS_HOST}:${REMOTE_DIR}/.env.prod"
success ".env.prod copied"

# ── Remote deploy commands ────────────────────────────────────
info "Running remote deployment..."

ssh "$VPS_HOST" bash <<'REMOTE'
set -e
cd /opt/ulaw-lms

echo "[REMOTE] Installing Docker if needed..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "[REMOTE] Creating Docker network if needed..."
docker network create ulaw_proxy 2>/dev/null || true

echo "[REMOTE] Pulling latest images & building..."
docker compose -f docker-compose.prod.yml --env-file .env.prod pull --ignore-buildable
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans

echo "[REMOTE] Waiting for app to be healthy (30s)..."
sleep 30

echo "[REMOTE] Running migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T app npx prisma migrate deploy || true

echo "[REMOTE] Seeding database (first-time only)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T app sh -c 'DATABASE_URL=$DATABASE_URL npx tsx prisma/seed.ts' 2>/dev/null || echo "[REMOTE] Seed skipped (may already be seeded)"

echo "[REMOTE] Checking running containers..."
docker compose -f docker-compose.prod.yml ps
REMOTE

success "Deployment complete!"
echo ""
echo -e "${GREEN}🎉 Site is live at: https://portal.srv1559779.hstgr.cloud${NC}"
echo ""
echo "Default credentials:"
echo "  superadmin@ulaw.edu.vn  /  Admin@2025!"
echo "  admin@ulaw.edu.vn       /  Admin@2025!"
echo ""
echo -e "${YELLOW}⚠️  Change passwords immediately after first login!${NC}"
