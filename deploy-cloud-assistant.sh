#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ $# -ne 2 ]]; then
  printf 'Usage: %s /absolute/path/to/flourishculturekol-homepage.zip /absolute/path/to/check-https-cloud-assistant.sh\n' "$0" >&2
  exit 2
fi

readonly WEB_ROOT="/var/www/flourishculturekol.com"
readonly ARCHIVE="$1"
readonly CHECK_SCRIPT="$2"
readonly BACKUP_ROOT="/var/backups/flourishculturekol.com"
readonly STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
readonly BACKUP="${BACKUP_ROOT}/${STAMP}-v1.2.0-static-6087ae5"
readonly BACKUP_TREE="${BACKUP}/tree"
readonly BACKUP_MANIFEST="${BACKUP}.SHA256SUMS"
readonly NGINX_CONFIG="/etc/nginx/conf.d/00-flourishculturekol.com.conf"
readonly EXPECTED_ARCHIVE_SHA="af10b1f4888bc848afeafa0055e55f5a480736940148f5ced26b5ec5e6707253"
readonly EXPECTED_CHECK_SCRIPT_SHA="dba3ae7de17beada857e07750e6d1e13eb715cdaf68e10d7366e7e28d7eb5ad8"
readonly EXPECTED_OLD_HOME_SHA="37b42852eb54b4ca5c065fea48c912d95e7296149e7b62c512e5b38f136aeacb"
readonly EXPECTED_OLD_STYLES_SHA="4e6903e9161f309c0aaa5d33e697d29798e6108e3eb5a54ffded0a4d96ea25d9"
readonly EXPECTED_NGINX_SHA="22efa58a328b5855999638133acc13a9472fa27132b1cba675479adbe2904d3e"
readonly EXPECTED_NEW_HOME_SHA="7339fe4e6d004739f0f2b86de92af0c86038502e0dc6b985bee738f860d533f2"
readonly EXPECTED_PRIVACY_SHA="ea1be315e5d0137d918d21a1fb7fff8ac0724057cb3c72ec7b0d1d5b40277f5a"
readonly EXPECTED_STYLES_SHA="61afde1b48e96219fb39db0f4930d0b7e5e9d76716f9d2cc9fea7bd8a54b2824"
readonly EXPECTED_SCRIPT_SHA="c6565c4b184b7a804ac3a882094de228faf45b9d50abfdb9070eebdb5b1368a7"
readonly EXPECTED_CONTACT_FORM_SHA="469f839535c4b8fefcecf7b8de61b9502cd06556a1a5fb89e2a1804ba68c96b2"
readonly EXPECTED_SITE_CORE_SHA="b8fe43f1ed63cdd3a643db6bf9d11ca282601fb7c94d1d113f5f76a8c2f6d24e"
readonly EXPECTED_SERVICE_IMAGE_SHA="995033f01f8c240270f1262760d61a43a3e57d2a13ca71ab6a5d048b465481ab"
readonly EXPECTED_TALENT_IMAGE_SHA="f9187abb6213fdd05725f0db3cf45551619465cea9b3758dfe8863b3e4fceed2"

WORK_DIR="$(mktemp -d /var/tmp/flourish-static-deploy.XXXXXX)"
ROLLBACK_NEEDED=0

sha256_file() {
  sha256sum "$1" | awk '{ print $1 }'
}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  return 1
}

assert_sha() {
  local file="$1"
  local expected="$2"
  local label="$3"
  local actual
  actual="$(sha256_file "$file")"
  [[ "$actual" == "$expected" ]] || fail "$label SHA-256 was $actual; expected $expected"
  printf 'OK: %s SHA-256 matches\n' "$label"
}

verify_release_files() {
  local root="$1"
  assert_sha "$root/index.html" "$EXPECTED_NEW_HOME_SHA" "Homepage"
  assert_sha "$root/privacy.html" "$EXPECTED_PRIVACY_SHA" "Privacy page"
  assert_sha "$root/styles.css" "$EXPECTED_STYLES_SHA" "styles.css"
  assert_sha "$root/script.js" "$EXPECTED_SCRIPT_SHA" "script.js"
  assert_sha "$root/contact-form.js" "$EXPECTED_CONTACT_FORM_SHA" "contact-form.js"
  assert_sha "$root/site-core.js" "$EXPECTED_SITE_CORE_SHA" "site-core.js"
  assert_sha "$root/assets/service-creative-localization-meetup.webp" "$EXPECTED_SERVICE_IMAGE_SHA" "Service 03 image"
  assert_sha "$root/assets/talent-creator-growth-studio.webp" "$EXPECTED_TALENT_IMAGE_SHA" "Our Talent image"
}

verify_runtime_invariants() {
  assert_sha "$NGINX_CONFIG" "$EXPECTED_NGINX_SHA" "Unchanged Nginx configuration" || return 1
  nginx -t || return 1
  systemctl is-active --quiet nginx || return 1
  systemctl is-active --quiet flourish-contact || return 1
  curl --silent --show-error --fail --noproxy '*' --max-time 15 \
    --resolve 'www.flourishculturekol.com:443:127.0.0.1' \
    'https://www.flourishculturekol.com/api/contact/health' \
    >/dev/null || return 1
  curl --silent --show-error --fail --noproxy '*' --max-time 15 \
    --resolve 'www.flourishculturekol.com:443:127.0.0.1' \
    'https://www.flourishculturekol.com/review/healthz' \
    >/dev/null || return 1
}

rollback_release() {
  local status=0

  printf 'ROLLBACK: restoring the exact pre-static web snapshot\n' >&2
  rsync -a --delete "$BACKUP_TREE/" "$WEB_ROOT/" || status=1
  find "$WEB_ROOT" -xdev -type d -exec chmod 0755 {} + || status=1
  find "$WEB_ROOT" -xdev -type f -exec chmod 0644 {} + || status=1
  [[ "$(sha256_file "$WEB_ROOT/index.html")" == "$EXPECTED_OLD_HOME_SHA" ]] || status=1
  [[ "$(sha256_file "$WEB_ROOT/styles.css")" == "$EXPECTED_OLD_STYLES_SHA" ]] || status=1
  (
    cd "$WEB_ROOT"
    sha256sum -c "$BACKUP_MANIFEST" >/dev/null
  ) || status=1
  verify_runtime_invariants || status=1

  if [[ "$status" -eq 0 ]]; then
    printf 'ROLLBACK: web root restored; Nginx, Contact, and Review remain healthy\n' >&2
  else
    printf 'CRITICAL: automatic static rollback verification failed\n' >&2
  fi
  return "$status"
}

cleanup_work_dir() {
  case "$WORK_DIR" in
    /var/tmp/flourish-static-deploy.*)
      find "$WORK_DIR" -depth -delete 2>/dev/null || true
      ;;
  esac
}

on_exit() {
  local status="$?"
  trap - EXIT
  if [[ "$status" -ne 0 && "$ROLLBACK_NEEDED" -eq 1 ]]; then
    set +e
    rollback_release
    set -e
  fi
  cleanup_work_dir
  exit "$status"
}
trap on_exit EXIT

[[ "$(id -u)" -eq 0 ]] || fail "must run as root"
[[ "$(hostname -s)" == "webhkhome" ]] || fail "unexpected host"
[[ "$ARCHIVE" == /* && "$CHECK_SCRIPT" == /* ]] || fail "release paths must be absolute"
for command_name in curl find nginx rsync sha256sum sort systemctl unzip; do
  command -v "$command_name" >/dev/null 2>&1 || fail "required command missing: $command_name"
done
for required in "$WEB_ROOT" "$ARCHIVE" "$CHECK_SCRIPT" "$BACKUP_ROOT" "$NGINX_CONFIG"; do
  [[ -e "$required" && ! -L "$required" ]] || fail "required path missing or unsafe: $required"
done
[[ ! -e "$BACKUP" && ! -e "$BACKUP_MANIFEST" ]] || fail "static backup target already exists"

assert_sha "$ARCHIVE" "$EXPECTED_ARCHIVE_SHA" "Static release archive"
assert_sha "$CHECK_SCRIPT" "$EXPECTED_CHECK_SCRIPT_SHA" "Production validation script"
assert_sha "$WEB_ROOT/index.html" "$EXPECTED_OLD_HOME_SHA" "Pre-release homepage"
assert_sha "$WEB_ROOT/styles.css" "$EXPECTED_OLD_STYLES_SHA" "Pre-release styles.css"
verify_runtime_invariants

# The archive is immutable by hash, but still reject absolute/traversal member names
# before extracting it as root.
unzip -Z1 "$ARCHIVE" | awk '
  /^\// || /(^|\/)\.\.($|\/)/ { bad = 1; print "Unsafe ZIP member: " $0 > "/dev/stderr" }
  END { exit bad }
'
unzip -q "$ARCHIVE" -d "$WORK_DIR/release"
[[ -z "$(find "$WORK_DIR/release" -type l -print -quit)" ]] || fail "static release contains a symlink"
for required in index.html privacy.html styles.css script.js contact-form.js site-core.js assets; do
  [[ -e "$WORK_DIR/release/$required" ]] || fail "static release is missing: $required"
done
verify_release_files "$WORK_DIR/release"

install -d -o root -g root -m 0700 "$BACKUP" "$BACKUP_TREE"
rsync -a "$WEB_ROOT/" "$BACKUP_TREE/"
chmod 0700 "$BACKUP"
(
  cd "$BACKUP_TREE"
  find . -xdev -type f -print0 | sort -z | xargs -0 sha256sum
) >"$BACKUP_MANIFEST"
chmod 0600 "$BACKUP_MANIFEST"
(
  cd "$BACKUP_TREE"
  sha256sum -c "$BACKUP_MANIFEST" >/dev/null
)
printf 'OK: exact pre-static snapshot created at %s\n' "$BACKUP"

ROLLBACK_NEEDED=1
rsync -a "$WORK_DIR/release/" "$WEB_ROOT/"
find "$WEB_ROOT" -xdev -type d -exec chmod 0755 {} +
find "$WEB_ROOT" -xdev -type f -exec chmod 0644 {} +
verify_release_files "$WEB_ROOT"
verify_runtime_invariants

PATH="/opt/node-v24.17.0-linux-x64/bin:$PATH" bash "$CHECK_SCRIPT"

ROLLBACK_NEEDED=0
printf 'SUCCESS: static v1.2.0 candidate 6087ae5 deployed and all production checks passed\n'
printf 'BACKUP: %s\n' "$BACKUP"
printf 'BACKUP_MANIFEST: %s\n' "$BACKUP_MANIFEST"
