#!/usr/bin/env bash
set -euo pipefail

DOMAIN="flourishculturekol.com"
WWW_DOMAIN="www.flourishculturekol.com"
WEB_ROOT="/var/www/flourishculturekol.com"
APP_NAME="tiktok-review-agent"
APP_DIR="/opt/tiktok-review-agent"
APP_PORT="8787"
APP_BASE_PATH="/review"
REPO_URL="${REPO_URL:-git@gitee.com:dechengzhang/tiktok-review-agent.git}"
BRANCH="${BRANCH:-master}"

# Fill these in before running through Cloud Assistant if /opt/tiktok-review-agent/.env
# does not already exist on this server.
REVIEW_PASSWORD="${REVIEW_PASSWORD:-}"
ARK_API_KEY="${ARK_API_KEY:-}"
ARK_BASE_URL="${ARK_BASE_URL:-https://ark.cn-beijing.volces.com/api/v3}"
ARK_MODEL="${ARK_MODEL:-doubao-seed-2-0-lite-260428}"

export DEBIAN_FRONTEND=noninteractive

log() {
  printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"
}

fail() {
  echo "FAILED: $*" >&2
  exit 1
}

install_pkg() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y "$@"
  elif command -v yum >/dev/null 2>&1; then
    yum install -y "$@"
  else
    fail "Unsupported OS: apt-get/yum not found"
  fi
}

ensure_tools() {
  command -v git >/dev/null 2>&1 || install_pkg git
  command -v curl >/dev/null 2>&1 || install_pkg curl
  command -v nginx >/dev/null 2>&1 || install_pkg nginx
  command -v python3 >/dev/null 2>&1 || install_pkg python3
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    systemctl enable --now docker >/dev/null 2>&1 || true
    return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    install_pkg ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
  elif command -v yum >/dev/null 2>&1; then
    install_pkg yum-utils
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin || yum install -y docker
  fi

  systemctl enable --now docker
}

sync_source() {
  mkdir -p "$(dirname "$APP_DIR")"
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
  else
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
}

ensure_base_path_support() {
  python3 - "$APP_DIR/server.js" "$APP_DIR/tiktok-review-agent.html" <<'PY'
from pathlib import Path
import sys

server = Path(sys.argv[1])
html = Path(sys.argv[2])

s = server.read_text()
if "const BASE_PATH = normalizeBasePath(" not in s:
    s = s.replace(
        "const HOST = process.env.HOST || '0.0.0.0';\n",
        "const HOST = process.env.HOST || '0.0.0.0';\n"
        "const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || process.env.PUBLIC_BASE_PATH || '');\n",
    )
    s = s.replace(
        "const rateBuckets = new Map();\n",
        "const rateBuckets = new Map();\n\n"
        "function normalizeBasePath(value) {\n"
        "  const raw = String(value || '').trim();\n"
        "  if (!raw || raw === '/') return '';\n"
        "  return `/${raw.replace(/^\\/+|\\/+$/g, '')}`;\n"
        "}\n\n"
        "function appPath(pathname = '/') {\n"
        "  const pathPart = pathname.startsWith('/') ? pathname : `/${pathname}`;\n"
        "  return `${BASE_PATH}${pathPart}`;\n"
        "}\n",
    )
    s = s.replace(
        "return `review_sid=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure}`;",
        "return `review_sid=${payload}.${sign(payload)}; Path=${BASE_PATH || '/'}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure}`;",
    )
    s = s.replace(
        "function loginPage() {\n  return `<!doctype html>",
        "function loginPage() {\n  const loginPath = appPath('/login');\n  return `<!doctype html>",
    )
    s = s.replace('action="/login"', 'action="${loginPath}"')
    s = s.replace(
        "send(res, 204, '', { 'Set-Cookie': 'review_sid=; Path=/; Max-Age=0' });",
        "send(res, 204, '', { 'Set-Cookie': `review_sid=; Path=${BASE_PATH || '/'}; Max-Age=0` });",
    )
    s = s.replace(
        "    req.url = url.pathname;\n\n    if (req.url === '/healthz') {",
        "    req.url = url.pathname;\n\n"
        "    if (BASE_PATH) {\n"
        "      if (req.url === BASE_PATH) {\n"
        "        send(res, 302, '', { Location: `${BASE_PATH}/` });\n"
        "        return;\n"
        "      }\n"
        "      if (req.url.startsWith(`${BASE_PATH}/`)) {\n"
        "        req.url = req.url.slice(BASE_PATH.length) || '/';\n"
        "      }\n"
        "    }\n\n"
        "    if (req.url === '/healthz') {",
    )
    s = s.replace("{ Location: '/' }", "{ Location: appPath('/') }")
    s = s.replace("{ Location: '/', 'Set-Cookie': makeSessionCookie(req) }", "{ Location: appPath('/'), 'Set-Cookie': makeSessionCookie(req) }")
    s = s.replace("{ Location: '/login' }", "{ Location: appPath('/login') }")
    s = s.replace(
        "send(res, 200, fs.readFileSync(INDEX_FILE), { 'Content-Type': 'text/html; charset=utf-8' });",
        "const html = fs.readFileSync(INDEX_FILE, 'utf8').replace(\n"
        "        'window.APP_BASE_PATH = \"\";',\n"
        "        `window.APP_BASE_PATH = ${JSON.stringify(BASE_PATH)};`\n"
        "      );\n"
        "      send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });",
    )
    server.write_text(s)

h = html.read_text()
if "window.APP_BASE_PATH" not in h:
    h = h.replace(
        "<title>TikTok 视频合规审核 Agent</title>",
        "<title>TikTok 视频合规审核 Agent</title>\n<script>window.APP_BASE_PATH = \"\";</script>",
    )
if "function appUrl(path)" not in h:
    h = h.replace(
        "let guideText     = '';\n",
        "let guideText     = '';\n\n"
        "const BASE_PATH = (window.APP_BASE_PATH || '').replace(/\\/+$/, '');\n"
        "function appUrl(path) {\n"
        "  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;\n"
        "}\n",
    )
    replacements = {
        "fetch('/api/config')": "fetch(appUrl('/api/config'))",
        "location.href = '/login'": "location.href = appUrl('/login')",
        "fetch('/api/config',": "fetch(appUrl('/api/config'),",
        "fetch('/api/versions')": "fetch(appUrl('/api/versions'))",
        "fetch('/api/versions/rollback',": "fetch(appUrl('/api/versions/rollback'),",
        "fetch('/api/logout',": "fetch(appUrl('/api/logout'),",
        "fetch('/api/chat/completions',": "fetch(appUrl('/api/chat/completions'),",
    }
    for old, new in replacements.items():
        h = h.replace(old, new)
    html.write_text(h)
PY
}

ensure_env() {
  if [ -f "$APP_DIR/.env" ]; then
    chmod 600 "$APP_DIR/.env"
    if ! grep -q '^BASE_PATH=' "$APP_DIR/.env"; then
      printf '\nBASE_PATH=%s\n' "$APP_BASE_PATH" >> "$APP_DIR/.env"
    fi
    return
  fi

  [ -n "$REVIEW_PASSWORD" ] || fail "Set REVIEW_PASSWORD at the top of this script before first deploy."
  [ -n "$ARK_API_KEY" ] || fail "Set ARK_API_KEY at the top of this script before first deploy."

  umask 177
  cat > "$APP_DIR/.env" <<ENV
PORT=$APP_PORT
HOST=0.0.0.0
BASE_PATH=$APP_BASE_PATH
REVIEW_PASSWORD=$REVIEW_PASSWORD
SESSION_DAYS=30
ARK_API_KEY=$ARK_API_KEY
ARK_BASE_URL=$ARK_BASE_URL
ARK_MODEL=$ARK_MODEL
CHAT_RATE_LIMIT_PER_HOUR=30
API_TIMEOUT_MS=180000
MAX_BODY_BYTES=262144000
ENV
  chmod 600 "$APP_DIR/.env"
}

run_app() {
  docker build -t "$APP_NAME:latest" "$APP_DIR"
  docker rm -f "$APP_NAME" >/dev/null 2>&1 || true
  docker run -d \
    --name "$APP_NAME" \
    --restart unless-stopped \
    --env-file "$APP_DIR/.env" \
    -p 127.0.0.1:${APP_PORT}:${APP_PORT} \
    "$APP_NAME:latest"
}

write_nginx_config() {
  mkdir -p "$WEB_ROOT"

  local ssl_dir="/etc/nginx/ssl/flourishculturekol.com"
  local acme_fullchain="$ssl_dir/fullchain.pem"
  local acme_key="$ssl_dir/privkey.pem"
  local le_fullchain="/etc/letsencrypt/live/flourishculturekol.com/fullchain.pem"
  local le_key="/etc/letsencrypt/live/flourishculturekol.com/privkey.pem"
  local fullchain=""
  local privkey=""

  if [ -f "$acme_fullchain" ] && [ -f "$acme_key" ]; then
    fullchain="$acme_fullchain"
    privkey="$acme_key"
  elif [ -f "$le_fullchain" ] && [ -f "$le_key" ]; then
    fullchain="$le_fullchain"
    privkey="$le_key"
  fi

  if [ -n "$fullchain" ]; then
    cat > /etc/nginx/conf.d/flourishculturekol.com.conf <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    root ${WEB_ROOT};

    location ^~ /.well-known/acme-challenge/ {
        root ${WEB_ROOT};
        default_type "text/plain";
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    ssl_certificate ${fullchain};
    ssl_certificate_key ${privkey};
    ssl_session_timeout 1d;
    ssl_session_cache shared:FlourishSSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 260m;

    location = ${APP_BASE_PATH} {
        return 301 ${APP_BASE_PATH}/;
    }

    location ^~ ${APP_BASE_PATH}/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Prefix ${APP_BASE_PATH};
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
  else
    cat > /etc/nginx/conf.d/flourishculturekol.com.conf <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    client_max_body_size 260m;

    location = ${APP_BASE_PATH} {
        return 301 ${APP_BASE_PATH}/;
    }

    location ^~ ${APP_BASE_PATH}/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Prefix ${APP_BASE_PATH};
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
  fi

  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t
  systemctl enable --now nginx
  systemctl reload nginx
}

smoke_check() {
  sleep 3
  curl -fsS "http://127.0.0.1:${APP_PORT}/healthz"
  curl -kfsSI "https://127.0.0.1${APP_BASE_PATH}/" -H "Host: ${WWW_DOMAIN}" || \
    curl -fsSI "http://127.0.0.1${APP_BASE_PATH}/" -H "Host: ${WWW_DOMAIN}"
  docker ps --filter "name=${APP_NAME}"
}

log "Installing required tools"
ensure_tools
ensure_docker

log "Syncing ${APP_NAME}"
sync_source

log "Ensuring ${APP_BASE_PATH} path support"
ensure_base_path_support

log "Ensuring app environment"
ensure_env

log "Starting ${APP_NAME}"
run_app

log "Configuring Nginx route ${APP_BASE_PATH}/ under ${WWW_DOMAIN}"
write_nginx_config

log "Running smoke checks"
smoke_check

echo
echo "Deployment finished."
echo "Review agent: https://${WWW_DOMAIN}${APP_BASE_PATH}/"
