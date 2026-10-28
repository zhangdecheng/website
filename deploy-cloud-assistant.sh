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
readonly BACKUP="${BACKUP_ROOT}/${STAMP}-v1.2.0-static-legal-001"
readonly BACKUP_TREE="${BACKUP}/tree"
readonly BACKUP_MANIFEST="${BACKUP}.SHA256SUMS"
readonly NGINX_CONFIG="/etc/nginx/conf.d/00-flourishculturekol.com.conf"
readonly EXPECTED_ARCHIVE_SHA="6cf81e5d0ecdd2d627f3e64a4a83dc8d8c5f48d9b47137dbf1bc8512a69206ed"
readonly EXPECTED_CHECK_SCRIPT_SHA="970667d3114143c0b518b5891bb6cc352c198e507889dc73f71f62a2e90fda50"
readonly EXPECTED_OLD_HOME_SHA="9858d19d5027c639b2a65c0869fc7f530a7b8db821f8206418a96d3ee5ff8035"
readonly EXPECTED_OLD_STYLES_SHA="416d75d4b7589691c7b0f406f41711cab17915f8fd86e1adec60610122ccf445"
readonly EXPECTED_NGINX_SHA="abc360c74bea67dd0ffcdd7d72713c36cb5509a278b84578949496b0ae7d3a0e"
readonly EXPECTED_NEW_HOME_SHA="9e7f7b10d4afc4abd131b0d573a4c5e0aa76cdf08ab92d9aa7012ec6ad18236d"
readonly EXPECTED_PRIVACY_SHA="dc4753d310fd74a973bae84f565bff136866dfcef989512691ef6fb2db4b85d1"
readonly EXPECTED_TERMS_SHA="3711ba4c9f04b928663292e70360eab3279a1f70776bb147433ec625d5fd7f0b"
readonly EXPECTED_DATA_DELETION_SHA="8f699151ccf7bc3916b07b7824d4d1fc7d0610d2616f2ccad48590472926f3e0"
readonly EXPECTED_STYLES_SHA="c0bf93984e3af00ff20cb91b7fd36393b89fbda56ff3d0ddf7784d4ddc926f63"
readonly EXPECTED_SCRIPT_SHA="613146fa4f87c0eec9d9cb8e2581eb1cda4d946f6e76b85c20739404ae02381b"
readonly EXPECTED_CONTACT_FORM_SHA="e2b1b507560f0567ae52a64a53334e7d5829aae8a7d080a7b30071394cdd2b8d"
readonly EXPECTED_SITE_CORE_SHA="b8fe43f1ed63cdd3a643db6bf9d11ca282601fb7c94d1d113f5f76a8c2f6d24e"
readonly EXPECTED_ROBOTS_SHA="2e988a2cae0368746dfb504ba79ebc5662abaf1410a82d4a9fa2e109f92a688e"
readonly EXPECTED_SITEMAP_SHA="1721fff9112c5601d1643473469a4ce78e2d9283799076825dfad6e694f12e7f"
readonly EXPECTED_CREATORS_SHA="e013e3545881d46f35ed9dc808ed7e779c1ca755fa983ce4960b9a0a25cb2569"
readonly EXPECTED_SERVICE_IMAGE_SHA="c4601f7a49a303e2bb5cca1b10390ea114bbacb411f41c5f99f29da63478db97"
readonly EXPECTED_TALENT_IMAGE_SHA="f9187abb6213fdd05725f0db3cf45551619465cea9b3758dfe8863b3e4fceed2"
readonly EXPECTED_ATOMS_LOGO_SHA="a24e629aa00be325844022f03043b4659bf9624fce617a7d52d66af93e3d26ea"
readonly EXPECTED_TRIPO_LOGO_SHA="5ddece931f2369199b0251dc2bc4a2a288654ece32806c7c939c3a0221508912"

WORK_DIR="$(mktemp -d /var/tmp/flourish-static-deploy.XXXXXX)"
RELEASE_FILE_LIST="$WORK_DIR/release-files.list"
RELEASE_DIR_LIST="$WORK_DIR/release-dirs.list"
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
  assert_sha "$root/terms.html" "$EXPECTED_TERMS_SHA" "Terms page"
  assert_sha "$root/data-deletion.html" "$EXPECTED_DATA_DELETION_SHA" "Data Deletion page"
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
  # Restore the snapshot over the web root without deleting unknown paths, then
  # remove only the files and empty directories this release added.
  rsync -a "$BACKUP_TREE/" "$WEB_ROOT/" || status=1
  if [[ -f "$RELEASE_FILE_LIST" ]]; then
    while IFS= read -r -d '' relative; do
      relative="${relative#./}"
      if [[ ! -e "$BACKUP_TREE/$relative" && -f "$WEB_ROOT/$relative" && ! -L "$WEB_ROOT/$relative" ]]; then
        rm -f -- "$WEB_ROOT/$relative" || status=1
      fi
    done <"$RELEASE_FILE_LIST"
  else
    status=1
  fi
  if [[ -f "$RELEASE_DIR_LIST" ]]; then
    while IFS= read -r -d '' relative; do
      relative="${relative#./}"
      if [[ ! -e "$BACKUP_TREE/$relative" && -d "$WEB_ROOT/$relative" && ! -L "$WEB_ROOT/$relative" ]]; then
        rmdir -- "$WEB_ROOT/$relative" 2>/dev/null || true
      fi
    done <"$RELEASE_DIR_LIST"
  else
    status=1
  fi
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
for required in index.html privacy.html terms.html data-deletion.html styles.css script.js contact-form.js site-core.js robots.txt sitemap.xml creators/index.html assets; do
  [[ -e "$WORK_DIR/release/$required" ]] || fail "static release is missing: $required"
done
verify_release_files "$WORK_DIR/release"
(
  cd "$WORK_DIR/release"
  find . -type f -print0
) >"$RELEASE_FILE_LIST"
(
  cd "$WORK_DIR/release"
  find . -mindepth 1 -depth -type d -print0
) >"$RELEASE_DIR_LIST"

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
printf 'SUCCESS: static v1.2.0 LEGAL-001 candidate deployed and all production checks passed\n'
printf 'BACKUP: %s\n' "$BACKUP"
printf 'BACKUP_MANIFEST: %s\n' "$BACKUP_MANIFEST"
