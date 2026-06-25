#!/usr/bin/env bash
set -euo pipefail

DOMAIN="flourishculturekol.com"
WWW_DOMAIN="www.flourishculturekol.com"

echo "== nginx config =="
nginx -t

echo
echo "== nginx status =="
systemctl --no-pager --full status nginx || true

echo
echo "== listening ports =="
ss -ltnp | grep -E ':(80|443)\b' || true

echo
echo "== certificates =="
certbot certificates || true

echo
echo "== local HTTP =="
curl -fsSI "http://127.0.0.1/" -H "Host: $DOMAIN" || true

echo
echo "== local HTTPS =="
curl -kfsSI "https://127.0.0.1/" -H "Host: $DOMAIN" || true
curl -kfsSI "https://127.0.0.1/" -H "Host: $WWW_DOMAIN" || true

echo
echo "== public HTTPS from this server =="
curl -fsSI --connect-timeout 10 "https://$DOMAIN/" || true
curl -fsSI --connect-timeout 10 "https://$WWW_DOMAIN/" || true
