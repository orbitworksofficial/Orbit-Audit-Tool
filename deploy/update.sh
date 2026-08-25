#!/usr/bin/env bash
#
# Pull the latest code and restart both services.
# Run as root:  bash /opt/orbitscanner/deploy/update.sh
#
set -euo pipefail

APP_DIR="/opt/orbitscanner"
PY_DIR="$APP_DIR/ORBIT WORKS BUSINESS AUDIT"
FE_DIR="$APP_DIR/frontend"

echo "==> Pulling latest code"
git -C "$APP_DIR" pull --ff-only

echo "==> Updating Python dependencies"
"$PY_DIR/venv/bin/pip" install --quiet -r "$PY_DIR/requirements.txt"

echo "==> Rebuilding frontend"
cd "$FE_DIR"
npm ci --no-audit --no-fund
npm run build

echo "==> Restarting services"
systemctl restart orbit-api orbit-web

sleep 3
systemctl is-active --quiet orbit-api && echo "    orbit-api: running" || echo "    orbit-api: FAILED — journalctl -u orbit-api -n 50"
systemctl is-active --quiet orbit-web && echo "    orbit-web: running" || echo "    orbit-web: FAILED — journalctl -u orbit-web -n 50"

echo "==> Done"
