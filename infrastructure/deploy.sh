#!/usr/bin/env bash
#
# NETEPAMALL — Deploy Web + Admin (Next.js) kuri VPS (Ubuntu/Debian)
#
# Ibikorwa:
#   1. Prepares infrastructure files kuri server
#   2. Kwandika / etc / host / etc (optional)
#   3. Kuba build Web na Admin
#   4. Setup systemd services (netepamall-web, netepamall-admin)
#   5. Setup nginx reverse proxy (HTTP/HTTPS)
#
# Usage (from repo root on YOUR machine, not on server):
#   ./infrastructure/deploy.sh --host root@IP --domain www.store.com --api https://api.store.com
#
# Requirements on server:
#   - root (cyangwa user with sudo)
#   - curl, git
#   - Node.js 18+ , npm
#   - nginx
# The script tseka installations if missing (needs apt).

set -euo pipefail

# ---- Defaults ----
HOST=""
DOMAIN="localhost"
API_URL="http://localhost:8000"
INSTALL_SOFTWARE=false
DRY_RUN=false
SKIP_BUILD=false

usage() {
  cat <<EOF
Usage: $0 --host USER@IP [options]

Options:
  --host <user@ip>     SSH host (required)
  --domain <name>      Site domain/domain for nginx (default: localhost)
  --api <url>          Backend API base URL (default: http://localhost:8000)
  --install            Install missing software (apt: node, nginx, git)
  --skip-build         Skip remote npm build (use for manual/CI build)
  --dry-run            Print plan only, do nothing
  -h, --help           Show this help
EOF
}

# ---- Parse args ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --api) API_URL="$2"; shift 2 ;;
    --install) INSTALL_SOFTWARE=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "ERROR: --host manqu"
  usage
  exit 1
fi

if [[ "$DRY_RUN" == true ]]; then
  echo "=== PLAN (dry-run) ==="
  echo "Host        : $HOST"
  echo "Domain      : $DOMAIN"
  echo "API base URL: $API_URL"
  echo "Install sw  : $INSTALL_SOFTWARE"
  echo "Skip build  : $SKIP_BUILD"
  echo ""
  echo "Ibizakorwa kuri server:"
  echo "  1. Install software (node, nginx, git)  [--install]"
  echo "  2. Copy web/ + admin/ via rsync"
  echo "  3. npm ci + next build (ambos)"
  echo "  4. Write systemd units netepamall-web + netepamall-admin"
  echo "  5. Write nginx conf + restart"
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_APP="$HOME/netepamall"

echo "==> Deploying to $HOST ($DOMAIN, API=$API_URL)"
echo "==> Remote base: $REMOTE_APP"

# ---- 0) Connect test ----
echo "==> [1/6] SSH connection..."
ssh -o ConnectTimeout=20 "$HOST" "echo connected && uname -a"

# ---- 1) Install prerequisites (optional) ----
if [[ "$INSTALL_SOFTWARE" == true ]]; then
  echo "==> [2/6] Installing node 18, nginx, git..."
  ssh "$HOST" "bash -s" <<'REMOTE'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
if ! command -v node >/dev/null 2>&1 || ! node --version | grep -qE '^v18\.'; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi
if ! command -v npm >/dev/null 2>&1; then apt-get install -y npm; fi
if ! command -v git >/dev/null 2>&1; then apt-get install -y git; fi
if ! command -v nginx >/dev/null 2>&1; then apt-get install -y nginx; fi
node --version; npm --version; nginx -v 2>&1
REMOTE
else
  echo "==> [2/6] Skipping software install (use --install)"
fi

# ---- 2) Sync source ----
echo "==> [3/6] Syncing source..."
ssh "$HOST" "mkdir -p $REMOTE_APP"
rsync -az --delete --exclude node_modules --exclude .next --exclude build --exclude .git \
  "$ROOT_DIR/web" \
  "$ROOT_DIR/admin" \
  "$HOST:$REMOTE_APP/"

# ---- 3) Build (remote) ----
if [[ "$SKIP_BUILD" == true ]]; then
  echo "==> [4/6] Skipping remote build (--skip-build)"
else
  echo "==> [4/6] Installing deps + building (this can take a while)..."
  ssh "$HOST" "bash -s" -- "$REMOTE_APP" "$API_URL" <<'REMOTE'
set -e
APP="$1"
API="$2"
for app in "$APP/web" "$APP/admin"; do
  echo "--- Building $app ---"
  (cd "$app" && npm ci --no-audit --no-fund)
  (cd "$app" && NEXT_PUBLIC_API_URL="$API" npm run build)
done
REMOTE
fi

# ---- 4) systemd units ----
echo "==> [5/6] Writing systemd units..."
ssh "$HOST" "bash -s" -- "$REMOTE_APP" <<'REMOTE'
set -e
APP="$1"
APPS=(web:8001 admin:8002)
for entry in "${APPS[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  svc="netepamall-$name"
  if [ -f "/etc/systemd/system/$svc.service" ]; then
    systemctl is-active --quiet "$svc" && systemctl stop "$svc"
  fi
  cat > "/etc/systemd/system/$svc.service" <<UNIT
[Unit]
Description=NETEPAMALL $name (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP/$name
Environment=NODE_ENV=production
Environment=PORT=$port
ExecStart=/usr/bin/npm run start -- -p $port
Restart=always
RestartSec=5
User=$USER

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable "$svc"
  systemctl restart "$svc"
done
REMOTE

# ---- 5) nginx ----
echo "==> [6/6] Writing nginx config..."
ssh "$HOST" "bash -s" -- "$DOMAIN" <<'REMOTE'
set -e
DOM="$1"
CONF="/etc/nginx/sites-available/netepamall"
if [ -f "/etc/nginx/sites-enabled/default-on-site" ]; then :; fi

cat > "$CONF" <<NGINX
# Web frontend (port 8001)
server {
    listen 80;
    server_name $DOM www.$DOM;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Admin panel (port 8002)
server {
    listen 80;
    server_name admin.$DOM;

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf "$CONF" /etc/nginx/sites-enabled/netepamall
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
REMOTE

echo ""
echo "=== DEPLOY YARANGIYE ==="
echo "Web        : http://$DOMAIN"
echo "Admin      : http://admin.$DOMAIN"
echo ""
echo "Ibyo uzabona: nginx reverse proxy -> next services (8001/8002)."
echo "Kuri API: ensure $API_URL yegera (backend yakoze uko yifashe)."
echo "Remember: TLS/HTTPS (certbot) ushyire gusa nyuma coordinates domain muri DNS."
