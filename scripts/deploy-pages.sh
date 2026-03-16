#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm not found. Please install Node.js 20+ first."
  exit 1
fi

echo "Building site..."
npm run build

echo "Deploying to Cloudflare Pages project: boke"
npx wrangler pages deploy dist --project-name=boke --branch=main --commit-dirty=true
