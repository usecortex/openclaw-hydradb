#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "ERROR: node is required (v18+)"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is required"; exit 1; }

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required (found v$(node -v | sed 's/v//'))"
  exit 1
fi

echo "==> Installing dependencies..."
npm ci

echo "==> Type-checking..."
npm run check-types || echo "WARN: Type-check failed (see errors above)"

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "IMPORTANT: Edit .env and add your API keys"
fi

echo ""
echo "Bootstrap complete!"
echo "Set HYDRA_OPENCLAW_API_KEY and HYDRA_OPENCLAW_TENANT_ID in .env (or export them)."
