#!/usr/bin/env bash
# =============================================================
# ULAW VB2 Portal — Postgres restore
#
# Usage:
#   scripts/restore.sh                                  # restore latest
#   scripts/restore.sh /var/backups/ulaw-portal/x.sql.gz
#
# Steps:
#   1. Stops the Next.js app container so writes don't conflict.
#   2. Streams the dump into psql (the dump already has DROP/CREATE
#      thanks to --clean --if-exists).
#   3. Restarts the app.
#
# Environment overrides match backup.sh.
# =============================================================

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ulaw-portal}"
PG_CONTAINER="${PG_CONTAINER:-ulaw_postgres}"
APP_CONTAINER="${APP_CONTAINER:-ulaw_app}"
PG_USER="${PG_USER:-ulaw_user}"
PG_DB="${PG_DB:-ulaw_portal}"

backup_file="${1:-}"

if [ -z "$backup_file" ]; then
  # Pick the newest .sql.gz under BACKUP_DIR.
  backup_file=$(ls -1t "$BACKUP_DIR"/${PG_DB}_*.sql.gz 2>/dev/null | head -1 || true)
  if [ -z "$backup_file" ]; then
    echo "No backups found in $BACKUP_DIR" >&2
    exit 1
  fi
  echo "Latest backup: $backup_file"
fi

if [ ! -f "$backup_file" ]; then
  echo "Backup file not found: $backup_file" >&2
  exit 1
fi

echo "About to restore $backup_file into $PG_CONTAINER:$PG_DB"
echo "This will OVERWRITE the current database. Press Ctrl+C within 5s to cancel."
sleep 5

echo "[$(date -Iseconds)] stopping app container ($APP_CONTAINER)…"
docker stop "$APP_CONTAINER" >/dev/null 2>&1 || echo "  (already stopped)"

echo "[$(date -Iseconds)] restoring…"
gunzip -c "$backup_file" | docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" --quiet --single-transaction --set ON_ERROR_STOP=1

echo "[$(date -Iseconds)] restore OK — restarting app…"
docker start "$APP_CONTAINER" >/dev/null
echo "[$(date -Iseconds)] done."
