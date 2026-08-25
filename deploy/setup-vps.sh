#!/usr/bin/env bash
#
# OrbitScanner — one-time VPS setup (Ubuntu 24.04 LTS)
#
# Installs Python, Node, Nginx and a firewall, clones the repo, builds both
# apps, and registers them as systemd services so they restart on reboot.
#
# Usage on a fresh server, as root:
#   bash setup-vps.sh https://github.com/YOU/YOUR-REPO.git
#
set -euo pipefail

REPO_URL="${1:-}"
APP_DIR="/opt/orbitscanner"
PY_DIR="$APP_DIR/ORBIT WORKS BUSINESS AUDIT"
FE_DIR="$APP_DIR/frontend"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: bash setup-vps.sh <git-repo-url>" >&2
  exit 1
fi

echo "==> 1/8  System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  python3 python3-venv python3-pip \
  nginx git curl ufw

echo "==> 2/8  Node.js 20 LTS"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
echo "    node $(node --version), python $(python3 --version)"

echo "==> 3/8  Clone repository"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" pull --ff-only
else
  rm -rf "$APP_DIR"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

echo "==> 4/8  Python backend"
python3 -m venv "$PY_DIR/venv"
"$PY_DIR/venv/bin/pip" install --quiet --upgrade pip
"$PY_DIR/venv/bin/pip" install --quiet -r "$PY_DIR/requirements.txt"

echo "==> 5/8  Next.js frontend"
cd "$FE_DIR"
npm ci --no-audit --no-fund
# .env.local must exist before building: Next.js inlines NEXT_PUBLIC_* values.
if [[ ! -f "$FE_DIR/.env.local" ]]; then
  echo "    !! $FE_DIR/.env.local is missing — create it, then re-run this script."
  echo "       See deploy/README.md for the required keys."
  exit 1
fi
npm run build

echo "==> 6/8  systemd services"
cat > /etc/systemd/system/orbit-api.service <<EOF
[Unit]
Description=OrbitScanner Python audit API
After=network.target

[Service]
Type=simple
WorkingDirectory=$PY_DIR
Environment="ENVIRONMENT=production"
EnvironmentFile=$PY_DIR/.env
ExecStart=$PY_DIR/venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5
# A scan runs 100-155s; do not let systemd consider that a hang.
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/orbit-web.service <<EOF
[Unit]
Description=OrbitScanner Next.js frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=$FE_DIR
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now orbit-api orbit-web

echo "==> 7/8  Nginx reverse proxy"
cat > /etc/nginx/sites-available/orbitscanner <<'EOF'
server {
    listen 80 default_server;
    server_name _;

    # A scan takes 100-155s. Nginx defaults to 60s, which would cut it off.
    proxy_read_timeout  300s;
    proxy_send_timeout  300s;
    proxy_connect_timeout 30s;

    client_max_body_size 10M;

    # Python audit service
    location /api/audit {
        proxy_pass http://127.0.0.1:8000;
        include /etc/nginx/proxy_params;
    }
    location /api/download-pdf {
        proxy_pass http://127.0.0.1:8000;
        include /etc/nginx/proxy_params;
    }
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        include /etc/nginx/proxy_params;
    }

    # Everything else is Next.js (including its own /api/* routes)
    location / {
        proxy_pass http://127.0.0.1:3000;
        include /etc/nginx/proxy_params;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/orbitscanner /etc/nginx/sites-enabled/orbitscanner
nginx -t
systemctl reload nginx

echo "==> 8/8  Firewall"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null

IP=$(curl -fsS --max-time 10 ifconfig.me || echo "YOUR-SERVER-IP")
echo
echo "============================================"
echo " Done. Your app is live at:  http://$IP"
echo "============================================"
echo
echo " Check status:   systemctl status orbit-api orbit-web"
echo " View logs:      journalctl -u orbit-api -f"
echo " Update code:    bash $APP_DIR/deploy/update.sh"
