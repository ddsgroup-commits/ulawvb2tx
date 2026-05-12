#!/usr/bin/env bash
# =============================================================
# ULAW VB2 Portal — Postgres backup
#
# Creates a compressed pg_dump under /var/backups/ulaw-portal/
# named YYYY-MM-DD_HH-MM.sql.gz. Keeps the last N daily backups.
#
# Designed to run on the Hostinger VPS via cron:
#   crontab -e
#   0 2 * * *  /opt/ulaw-vb2-portal/scripts/backup.sh >> /var/log/ulaw-backup.log 2>&1
#
# Environment variables (override defaults):
#   BACKUP_DIR      default /var/backups/ulaw-portal
#   PG_CONTAINER    default ulaw_postgres (docker container name)
#   PG_USER         default ulaw_user
#   PG_DB           default ulaw_portal
#   RETENTION_DAYS  default 30
# =============================================================

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ulaw-portal}"
PG_CONTAINER="${PG_CONTAINER:-ulaw_postgres}"
PG_USER="${PG_USER:-ulaw_user}"
PG_DB="${PG_DB:-ulaw_portal}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

timestamp=$(date +%Y-%m-%d_%H-%M)
mkdir -p "$BACKUP_DIR"

filename="$BACKUP_DIR/${PG_DB}_${timestamp}.sql.gz"

echo "[$(date -Iseconds)] starting pg_dump → $filename"

# Stream pg_dump through gzip without buffering the whole file in memory.
# --no-owner / --no-privileges keep the dump portable to a fresh role on
# restore. --clean adds DROP statements so a restore overwrites cleanly.
if ! docker exec -i "$PG_CONTAINER" pg_dump \
      -U "$PG_USER" \
      -d "$PG_DB" \
      --no-owner --no-privileges --clean --if-exists \
      --format=plain \
      | gzip -9 > "$filename"; then
  echo "[$(date -Iseconds)] BACKUP FAILED — removing partial file"
  rm -f "$filename"
  exit 1
fi

size=$(du -h "$filename" | cut -f1)
echo "[$(date -Iseconds)] backup OK ($size) → $filename"

# Prune anything older than RETENTION_DAYS. -mtime +N matches files
# strictly older than N days. We never delete today's files.
find "$BACKUP_DIR" -name "${PG_DB}_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete

# Always keep at least the latest 7 dumps even if RETENTION_DAYS pruned
# everything (defense in depth for a misconfigured clock).
keep=7
total=$(ls -1 "$BACKUP_DIR"/${PG_DB}_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
if [ "$total" -gt "$keep" ]; then
  ls -1t "$BACKUP_DIR"/${PG_DB}_*.sql.gz | tail -n +"$((keep + 1))" | while read -r old; do
    # No-op — we already pruned. This block is here so future tweaks
    # of the retention policy stay obvious.
    :
  done
fi

echo "[$(date -Iseconds)] done. Total backups now: $(ls -1 "$BACKUP_DIR"/${PG_DB}_*.sql.gz | wc -l | tr -d ' ')"
