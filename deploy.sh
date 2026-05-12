#!/usr/bin/env bash
# ============================================================
# ULAW VB2 Portal – VPS Deployment Script
# Target: Hostinger VPS (Ubuntu 22.04)
# Domain: https://portal.srv1559779.hstgr.cloud
#
# Usage (run on your VPS via SSH):
#   chmod +x deploy.sh
#   ./deploy.sh
#
# First-time deploy: runs migrations + seed
# Re-deploy:        rebuilds image and restarts app only
# ============================================================
set -euo pipefail

# ── Config ──────────────────────────────────────────────────
DOMAIN="portal.srv1559779.hstgr.cloud"
APP_DIR="/opt/ulaw-portal"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# ── Colors ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Step 1: Check Docker ─────────────────────────────────────
info "Checking Docker..."
if ! command -v docker &>/dev/null; then
  warn "Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$USER"
  info "Docker installed. You may need to log out and back in for group changes."
else
  info "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') found."
fi

if ! docker compose version &>/dev/null; then
  error "Docker Compose plugin not found. Run: apt install docker-compose-plugin"
fi

# ── Step 2: Prepare app directory ────────────────────────────
info "Preparing app directory at $APP_DIR..."
mkdir -p "$APP_DIR"

# If running from the project root, sync files to app dir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
  info "Syncing project files to $APP_DIR..."
  rsync -av --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env.production' \
    "$SCRIPT_DIR/" "$APP_DIR/"
fi

cd "$APP_DIR"

# ── Step 3: Check .env.production ────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  error ".env.production not found in $APP_DIR.

  Run this to set it up:
    cp .env.production.example .env.production
    nano .env.production    # fill in all values

  Then re-run: ./deploy.sh"
fi

info "Environment file found."

# ── Step 4: Open firewall ports ──────────────────────────────
info "Ensuring ports 80 and 443 are open..."
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  info "UFW rules updated."
fi

# ── Step 5: Pull / build images ──────────────────────────────
info "Building Docker images (this may take 3–5 minutes on first run)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache app

# ── Step 6: Start database ───────────────────────────────────
info "Starting PostgreSQL..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres

info "Waiting for database to be ready..."
until docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_isready -U ulaw_user -d ulaw_portal &>/dev/null; do
  printf "."
  sleep 2
done
echo ""
info "Database is ready."

# ── Step 7: Run migrations ───────────────────────────────────
info "Running Prisma migrations + seed..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm migrate
info "Migrations complete."

# ── Step 8: Start Traefik + app ──────────────────────────────
info "Starting Traefik and application..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d traefik app

# ── Step 9: Health check ─────────────────────────────────────
info "Waiting for app to start..."
sleep 8

if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps app | grep -q "running"; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅  Deployment complete!                        ║${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║  🌐  https://$DOMAIN  ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "Useful commands:"
  echo -e "  ${YELLOW}docker compose -f $COMPOSE_FILE logs -f app${NC}       # live logs"
  echo -e "  ${YELLOW}docker compose -f $COMPOSE_FILE ps${NC}                # service status"
  echo -e "  ${YELLOW}docker compose -f $COMPOSE_FILE restart app${NC}       # restart app"
  echo -e "  ${YELLOW}docker compose -f $COMPOSE_FILE down${NC}              # stop all"
else
  warn "App container may not be running yet. Check logs:"
  echo "  docker compose -f $COMPOSE_FILE logs app"
fi
