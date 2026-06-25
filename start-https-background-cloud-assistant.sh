#!/usr/bin/env bash
set -euo pipefail

cat > /root/enable_https_acme.sh <<'SCRIPT'
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

trap 'echo "FAILED at line $LINENO. Check the lines above for the real error."' ERR

log "START https setup"

log "Install base packages"
apt-get update
apt-get install -y nginx curl ca-certificates openssl cron socat

log "Prepare nginx HTTP challenge site"
mkdir -p "$WEB_ROOT/.well-known/acme-challenge" "$SSL_DIR"
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
curl -fsSI "http://127.0.0.1/" -H "Host: $DOMAIN"

log "Install acme.sh"
if [ ! -x "$ACME" ]; then
  curl -fsSL https://get.acme.sh | sh -s email="$EMAIL"
fi

log "Issue certificate"
"$ACME" --set-default-ca --server letsencrypt
"$ACME" --issue --server letsencrypt -d "$DOMAIN" -d "$WWW_DOMAIN" -w "$WEB_ROOT" --keylength ec-256

log "Install certificate"
"$ACME" --install-cert -d "$DOMAIN" --ecc \
  --key-file "$SSL_DIR/privkey.pem" \
  --fullchain-file "$SSL_DIR/fullchain.pem" \
  --reloadcmd "systemctl reload nginx"

log "Write nginx HTTPS config"
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
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

nginx -t
systemctl reload nginx

log "Verify local HTTPS"
ss -ltnp | grep ':443' || true
curl -kfsSI "https://127.0.0.1/" -H "Host: $DOMAIN"

log "DONE https setup"
SCRIPT

chmod +x /root/enable_https_acme.sh
nohup /root/enable_https_acme.sh >/root/https-setup.log 2>&1 &

echo "Started HTTPS setup in background."
echo "Log file: /root/https-setup.log"
echo "Check with: tail -n 80 /root/https-setup.log"
