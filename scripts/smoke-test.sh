#!/usr/bin/env bash
# ==============================================================================
# SupportPilot AI — Deployment Smoke Test Runner
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-${TARGET_URL:-http://localhost:5000}}"

echo "🚀 Executing SupportPilot AI Deployment Smoke Tests against: ${TARGET_URL}"
npx tsx scripts/smoke-test.ts "${TARGET_URL}"
