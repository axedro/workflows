#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[Resume E2E] Building workspace..."
pnpm -w run build > /dev/null

echo "[Resume E2E] Restarting dev services..."
"$ROOT_DIR/scripts/restart-dev.sh" > /dev/null

echo "[Resume E2E] Running test-resume-execution.js..."
node "$ROOT_DIR/test-resume-execution.js"
