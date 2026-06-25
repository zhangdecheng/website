#!/usr/bin/env bash
set -euo pipefail

WEB_ROOT="${WEB_ROOT:-/var/www/flourishculturekol.com}"
ARCHIVE="${1:-/root/flourishculturekol-homepage.zip}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/flourishculturekol.com}"
STAMP="$(date +%Y%m%d-%H%M%S)"
STAGE="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGE"
}
trap cleanup EXIT

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Release archive not found: $ARCHIVE" >&2
  exit 1
fi

command -v unzip >/dev/null 2>&1 || {
  echo "unzip is required on the server." >&2
  exit 1
}

unzip -q "$ARCHIVE" -d "$STAGE"

for required in index.html styles.css script.js site-core.js assets; do
  if [[ ! -e "$STAGE/$required" ]]; then
    echo "Release archive is missing: $required" >&2
    exit 1
  fi
done

mkdir -p "$WEB_ROOT" "$BACKUP_ROOT/$STAMP"
cp -a "$WEB_ROOT/." "$BACKUP_ROOT/$STAMP/" 2>/dev/null || true

# Copy only homepage release files. This deliberately does not delete unrelated
# files and never edits Nginx, certificates, /review/, configuration, or data.
cp -a "$STAGE/." "$WEB_ROOT/"
find "$WEB_ROOT" -type d -exec chmod 755 {} +
find "$WEB_ROOT" -type f -exec chmod 644 {} +

if command -v nginx >/dev/null 2>&1; then
  nginx -t
fi

echo "Homepage files copied to $WEB_ROOT"
echo "Previous web root backed up to $BACKUP_ROOT/$STAMP"
echo "Nginx configuration and /review/ were not modified."
