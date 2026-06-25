#!/usr/bin/env bash
set -euo pipefail

DOMAIN="flourishculturekol.com"
WWW_DOMAIN="www.flourishculturekol.com"
EMAIL="zdc0501@163.com"
WEB_ROOT="/var/www/flourishculturekol.com"
SSL_DIR="/etc/nginx/ssl/flourishculturekol.com"
ACME_HOME="/root/.acme.sh"
ACME="$ACME_HOME/acme.sh"

export DEBIAN_FRONTEND=noninteractive

log() {
  printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"
}

fail() {
  echo "FAILED: $*" >&2
  exit 1
}

trap 'echo "FAILED at line $LINENO. Check the lines above for the real error."' ERR

log "Installing base packages"
if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y nginx curl ca-certificates openssl cron
elif command -v yum >/dev/null 2>&1; then
  yum install -y nginx curl ca-certificates openssl cronie
else
  fail "Unsupported OS: apt-get/yum not found"
fi

log "Ensuring HTTP site and ACME challenge path"
mkdir -p "$WEB_ROOT/.well-known/acme-challenge" "$SSL_DIR"
chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || true

cat > /etc/nginx/conf.d/flourishculturekol.com.conf <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    location ^~ /.well-known/acme-challenge/ {
        root ${WEB_ROOT};
        default_type "text/plain";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable --now nginx
systemctl reload nginx

log "Testing local HTTP before issuing certificate"
curl -fsSI "http://127.0.0.1/" -H "Host: $DOMAIN"

log "Installing acme.sh if needed"
if [ ! -x "$ACME" ]; then
  curl -fsSL https://get.acme.sh | sh -s email="$EMAIL"
fi

[ -x "$ACME" ] || fail "acme.sh was not installed at $ACME"

log "Configuring Let's Encrypt as ACME CA"
"$ACME" --set-default-ca --server letsencrypt

log "Issuing certificate through webroot HTTP challenge"
"$ACME" --issue \
  --server letsencrypt \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN" \
  -w "$WEB_ROOT" \
  --keylength ec-256

log "Installing certificate into nginx ssl directory"
"$ACME" --install-cert \
  -d "$DOMAIN" \
  --ecc \
  --key-file "$SSL_DIR/privkey.pem" \
  --fullchain-file "$SSL_DIR/fullchain.pem" \
  --reloadcmd "systemctl reload nginx"

log "Writing final nginx HTTPS config"
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

    ssl_certificate ${SSL_DIR}/fullchain.pem;
    ssl_certificate_key ${SSL_DIR}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:FlourishSSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

nginx -t
systemctl reload nginx

log "Checking local HTTPS"
ss -ltnp | grep ':443' || true
curl -kfsSI "https://127.0.0.1/" -H "Host: $DOMAIN"
curl -kfsSI "https://127.0.0.1/" -H "Host: $WWW_DOMAIN"

log "HTTPS enabled"
echo "Visit: https://${DOMAIN}"
echo "Visit: https://${WWW_DOMAIN}"
