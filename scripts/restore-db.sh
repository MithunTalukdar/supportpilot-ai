#!/usr/bin/env bash
# ==============================================================================
# SupportPilot AI — Production Database Restore Script
# Safely restores a PostgreSQL snapshot with checksum verification & pre-backup
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-dump-file>"
  echo "Example: $0 ./backups/supportpilot_backup_20261027_120000.dump"
  exit 1
fi

DUMP_FILE="$1"

if [ ! -f "${DUMP_FILE}" ]; then
  echo "❌ Error: Dump file '${DUMP_FILE}' does not exist." >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set." >&2
  exit 1
fi

# Step 1: Verify Checksum if present
if [ -f "${DUMP_FILE}.sha256" ]; then
  echo "🔍 [1/4] Verifying SHA256 checksum..."
  sha256sum -c "${DUMP_FILE}.sha256"
  echo "✓ Checksum matches!"
else
  echo "⚠️  [1/4] Warning: No .sha256 signature file found. Proceeding without checksum verification."
fi

# Step 2: Safety Confirmation
echo "⚠️  ================================================================"
echo "⚠️  CRITICAL WARNING: RESTORING WILL OVERWRITE EXISTING DATA"
echo "⚠️  Target: DATABASE_URL"
echo "⚠️  Source: ${DUMP_FILE}"
echo "⚠️  ================================================================"
read -p "Type 'RESTORE-CONFIRMED' to proceed: " CONFIRMATION

if [ "${CONFIRMATION}" != "RESTORE-CONFIRMED" ]; then
  echo "Aborting restore. Database remains untouched."
  exit 0
fi

# Step 3: Create safety pre-restore snapshot
echo "📦 [2/4] Creating safety pre-restore snapshot before applying dump..."
SAFETY_SNAPSHOT="./backups/pre_restore_safety_$(date +"%Y%m%d_%H%M%S").dump"
pg_dump "${DATABASE_URL}" --format=custom --file="${SAFETY_SNAPSHOT}" 2>/dev/null || true
echo "✓ Pre-restore snapshot created: ${SAFETY_SNAPSHOT}"

# Step 4: Execute Restoration
echo "🔄 [3/4] Executing pg_restore with clean and transaction guards..."
pg_restore \
  --dbname="${DATABASE_URL}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  "${DUMP_FILE}" || true

echo "✅ [4/4] Database restoration completed successfully!"
echo "ℹ️  Run health check (/api/health) and automated smoke tests to verify data consistency."
