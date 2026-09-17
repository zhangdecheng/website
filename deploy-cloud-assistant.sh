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
readonly BACKUP="${BACKUP_ROOT}/${STAMP}-v1.2.0-static-and-word-c96f7bc5"
readonly BACKUP_TREE="${BACKUP}/tree"
readonly BACKUP_MANIFEST="${BACKUP}.SHA256SUMS"
readonly NGINX_CONFIG="/etc/nginx/conf.d/00-flourishculturekol.com.conf"
readonly EXPECTED_ARCHIVE_SHA="a05bab714425f86d9513daac14ca8201dc0ed2093e2eaf171a0e4999747b7490"
readonly EXPECTED_CHECK_SCRIPT_SHA="e1c121a57a20a79deed358798f84270f5de3dc36df53330d04c294296680ed1a"
readonly EXPECTED_OLD_HOME_SHA="41cdf6d1fdc2f514d348677aa3203dbe2cb496c3040859e14f82c7da07be34ec"
readonly EXPECTED_OLD_STYLES_SHA="f563de2f86121fbebf384ba512fb71cf227a96651d5b7daadc35146006ef6891"
readonly EXPECTED_NGINX_SHA="4851586cb8c33d1a7b9f740e6b6f429dce087d5efd2e8d6afc90ffc7742abf5d"
readonly EXPECTED_NEW_HOME_SHA="9e16117749beee11981e1a5de902426e5d48784bb34cf98810612597a9e0e7e3"
readonly EXPECTED_PRIVACY_SHA="a36c172a358b2325b752e8b87e3f08c548ec035cf0de3f24bcdc0d28c2b404c2"
readonly EXPECTED_STYLES_SHA="bec87d9432d03be952c37537bb09dce7d726e1848bb51e05b235916e2b60a83a"
readonly EXPECTED_SCRIPT_SHA="613146fa4f87c0eec9d9cb8e2581eb1cda4d946f6e76b85c20739404ae02381b"
readonly EXPECTED_CONTACT_FORM_SHA="e2b1b507560f0567ae52a64a53334e7d5829aae8a7d080a7b30071394cdd2b8d"
readonly EXPECTED_SITE_CORE_SHA="b8fe43f1ed63cdd3a643db6bf9d11ca282601fb7c94d1d113f5f76a8c2f6d24e"
readonly EXPECTED_ROBOTS_SHA="2e988a2cae0368746dfb504ba79ebc5662abaf1410a82d4a9fa2e109f92a688e"
readonly EXPECTED_SITEMAP_SHA="bb0eadfa45fd76630d37bbe6068eb209df5df89cda3acc98d1fc5cfdaf7876db"
readonly EXPECTED_CREATORS_SHA="f13d05c489d902da7866707c6e8a22a4bdcf765651c84402449011bdde049a53"
readonly EXPECTED_SERVICE_IMAGE_SHA="c4601f7a49a303e2bb5cca1b10390ea114bbacb411f41c5f99f29da63478db97"
readonly EXPECTED_TALENT_IMAGE_SHA="f9187abb6213fdd05725f0db3cf45551619465cea9b3758dfe8863b3e4fceed2"
readonly EXPECTED_ATOMS_LOGO_SHA="a24e629aa00be325844022f03043b4659bf9624fce617a7d52d66af93e3d26ea"
readonly EXPECTED_TRIPO_LOGO_SHA="5ddece931f2369199b0251dc2bc4a2a288654ece32806c7c939c3a0221508912"

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
  if [[ "$actual" != "$expected" ]]; then
    fail "$label SHA-256 was $actual; expected $expected"
    return 1
  fi
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
  assert_sha "$root/robots.txt" "$EXPECTED_ROBOTS_SHA" "robots.txt"
  assert_sha "$root/sitemap.xml" "$EXPECTED_SITEMAP_SHA" "sitemap.xml"
  assert_sha "$root/creators/index.html" "$EXPECTED_CREATORS_SHA" "Creators page"
  assert_sha "$root/assets/service-creative-localization-camera-speaker.webp" "$EXPECTED_SERVICE_IMAGE_SHA" "Service 03 image"
  assert_sha "$root/assets/talent-creator-growth-studio.webp" "$EXPECTED_TALENT_IMAGE_SHA" "Our Talent image"
  assert_sha "$root/assets/brand-logos/atoms-transparent.png" "$EXPECTED_ATOMS_LOGO_SHA" "Atoms logo"
  assert_sha "$root/assets/brand-logos/tripo-transparent-cropped.png" "$EXPECTED_TRIPO_LOGO_SHA" "TRIPO logo"
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
for required in index.html privacy.html styles.css script.js contact-form.js site-core.js robots.txt sitemap.xml creators/index.html assets; do
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
printf 'SUCCESS: static v1.2.0 and-word candidate c96f7bc5 deployed and all production checks passed\n'
printf 'BACKUP: %s\n' "$BACKUP"
printf 'BACKUP_MANIFEST: %s\n' "$BACKUP_MANIFEST"
