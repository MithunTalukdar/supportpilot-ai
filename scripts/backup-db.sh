#!/usr/bin/env bash
# ==============================================================================
# SupportPilot AI — Production Database Backup Script
# Creates a compressed, timestamped, checksummed PostgreSQL snapshot
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="supportpilot_backup_${TIMESTAMP}.dump"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set." >&2
  exit 1
fi

echo "📦 [1/3] Initiating PostgreSQL snapshot..."
# Using pg_dump with custom archive format (-Fc) which includes compression and supports parallel restoration
pg_dump "${DATABASE_URL}" \
  --format=custom \
  --blobs \
  --verbose \
  --file="${FILEPATH}" 2>/dev/null

echo "🔒 [2/3] Generating SHA256 integrity checksum..."
sha256sum "${FILEPATH}" > "${FILEPATH}.sha256"

FILESIZE=$(du -h "${FILEPATH}" | cut -f1)
CHECKSUM=$(cat "${FILEPATH}.sha256" | cut -d' ' -f1)

echo "✅ [3/3] Backup completed successfully!"
echo "--------------------------------------------------"
echo "File:     ${FILEPATH}"
echo "Size:     ${FILESIZE}"
echo "SHA256:   ${CHECKSUM}"
echo "Timestamp: ${TIMESTAMP}"
echo "--------------------------------------------------"
echo "ℹ️  Store this backup and its .sha256 signature in encrypted off-site cloud storage (e.g. AWS S3 Glacier or GCS Archive)."
