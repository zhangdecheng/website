#!/usr/bin/env bash
set -euo pipefail

DOMAIN="flourishculturekol.com"
WWW_DOMAIN="www.flourishculturekol.com"
EMAIL="${EMAIL:-zdc0501@163.com}"

export DEBIAN_FRONTEND=noninteractive

log() {
  printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"
}

trap 'echo "FAILED at line $LINENO. Check the lines above for the real error."' ERR

if command -v apt-get >/dev/null 2>&1; then
  log "Installing certbot through snap to avoid system Python dependency conflicts"
  apt-get update
  apt-get install -y snapd
  systemctl enable --now snapd.socket
  snap wait system seed.loaded
  snap install core || true
  snap refresh core || true
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
elif command -v yum >/dev/null 2>&1; then
  log "Installing certbot through snap/yum"
  yum install -y snapd || yum install -y certbot
  if command -v snap >/dev/null 2>&1; then
    systemctl enable --now snapd.socket
    snap install core || true
    snap refresh core || true
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
  fi
else
  echo "Unsupported OS: apt-get/yum not found" >&2
  exit 1
fi

log "Certbot version"
certbot --version

log "Checking nginx"
nginx -t
systemctl enable --now nginx
systemctl reload nginx

log "Requesting certificate for ${DOMAIN} and ${WWW_DOMAIN}"
certbot --nginx \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --redirect

log "Reloading nginx"
nginx -t
systemctl reload nginx

log "Local HTTPS listener check"
ss -ltnp | grep ':443' || true

log "Local nginx HTTPS smoke check"
curl -kfsSI "https://127.0.0.1/" -H "Host: $DOMAIN" || true
curl -kfsSI "https://127.0.0.1/" -H "Host: $WWW_DOMAIN" || true

echo "HTTPS enabled for $DOMAIN and $WWW_DOMAIN"
