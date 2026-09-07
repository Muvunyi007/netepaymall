#!/usr/bin/env bash
#
# NETEPAYMALL — auto-deploy bootstrap for VPS.
# Runs ON the server (via ssh 'bash -s'). Called by GitHub Actions deploy.yml
# and usable manually:   ssh host 'REMOTE=/root/netepaymall API_URL=... bash -s' < infrastructure/deploy-remote.sh
#
# Required env: REMOTE, API_URL, REPO

set -euo pipefail

echo "==> [1/5] Install prerequisites (git, node/npm, nginx)"
if ! command -v apt-get >/dev/null 2>&1; then
  echo "FATAL: apt-get not found"; exit 1
fi
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
if ! command -v git >/dev/null 2>&1; then apt-get install -y -qq git; fi
if ! command -v node >/dev/null 2>&1 || ! node --version | grep -qE '^v(18|20)\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
if ! command -v npm >/dev/null 2>&1; then apt-get install -y -qq npm; fi
if ! command -v nginx >/dev/null 2>&1; then apt-get install -y -qq nginx; fi
echo "node: $(node --version) / npm: $(npm --version) / git: $(git --version)"

echo "==> [2/5] Clone/pull repo ($REPO)"
mkdir -p "$REMOTE"
cd "$REMOTE"
if [ ! -d .git ]; then
  git clone "$REPO" .
else
  git fetch origin main && git reset --hard origin/main
fi

echo "==> [3/5] Build web + admin (API_URL=$API_URL)"
for app in web admin; do
  echo "--- $app ---"
  cd "$REMOTE/$app"
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
  NEXT_PUBLIC_API_URL="$API_URL" npm run build
done

echo "==> [4/5] systemd services (web:8001, admin:8002)"
USR="$(id -un)"
for entry in "web:8001" "admin:8002"; do
  name="${entry%%:*}"; port="${entry##*:}"; svc="netepamall-$name"
  cat > "/etc/systemd/system/$svc.service" <<UNIT
[Unit]
Description=NETEPAMALL $name (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$REMOTE/$name
Environment=NODE_ENV=production
Environment=PORT=$port
ExecStart=/usr/bin/npm run start -- -p $port
Restart=always
RestartSec=5
User=$USR

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable "$svc"
  systemctl restart "$svc"
done

echo "==> [5/5] nginx (web on :80)"
cat > /etc/nginx/sites-available/netepaymall <<NGINX
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 25M;
    location / { proxy_pass http://127.0.0.1:8001; proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
}
NGINX
ln -sf /etc/nginx/sites-available/netepaymall /etc/nginx/sites-enabled/netepaymall
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx || systemctl restart nginx || true

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "DEPLOY OK"
echo "Web:   http://$IP     Admin: http://$IP:8002"