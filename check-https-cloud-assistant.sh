#!/usr/bin/env bash
set -euo pipefail

WWW_ORIGIN="https://www.flourishculturekol.com"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

pass() {
  printf 'OK: %s\n' "$1"
}

fetch() {
  local method="$1"
  local url="$2"
  local headers="$3"
  local body="$4"
  shift 4
  curl \
    --silent \
    --show-error \
    --connect-timeout 10 \
    --max-time 20 \
    --max-redirs 0 \
    --request "$method" \
    --dump-header "$headers" \
    --output "$body" \
    --write-out '%{http_code}' \
    "$@" \
    "$url"
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  [[ "$actual" == "$expected" ]] || fail "$label returned HTTP $actual; expected $expected"
  pass "$label returned HTTP $expected"
}

header_value() {
  local file="$1"
  local name="$2"
  awk -v wanted="$name" '
    index(tolower($0), tolower(wanted) ":") == 1 {
      sub(/^[^:]+:[[:space:]]*/, "")
      sub(/\r$/, "")
      print
      exit
    }
  ' "$file"
}

assert_header() {
  local file="$1"
  local name="$2"
  local expected_fragment="$3"
  local label="$4"
  local actual
  actual="$(header_value "$file" "$name")"
  [[ -n "$actual" ]] || fail "$label is missing $name"
  [[ "$actual" == *"$expected_fragment"* ]] || fail "$label $name did not contain: $expected_fragment"
  pass "$label includes $name"
}

assert_location() {
  local file="$1"
  local expected="$2"
  local label="$3"
  local actual
  actual="$(header_value "$file" "Location")"
  [[ "$actual" == "$expected" ]] || fail "$label Location was '$actual'; expected '$expected'"
  pass "$label preserves the canonical path and query"
}

assert_contains() {
  local file="$1"
  local text="$2"
  local label="$3"
  grep -Fq "$text" "$file" || fail "$label did not contain: $text"
  pass "$label contains the required markup"
}

assert_sha256() {
  local file="$1"
  local expected="$2"
  local label="$3"
  local actual
  actual="$(sha256sum "$file" | awk '{ print $1 }')"
  [[ "$actual" == "$expected" ]] || fail "$label SHA-256 was $actual; expected $expected"
  pass "$label SHA-256 matches the release"
}

assert_page_headers() {
  local file="$1"
  local label="$2"
  assert_header "$file" "Content-Security-Policy" "frame-ancestors 'none'" "$label"
  assert_header "$file" "X-Content-Type-Options" "nosniff" "$label"
  assert_header "$file" "Referrer-Policy" "strict-origin-when-cross-origin" "$label"
  assert_header "$file" "Permissions-Policy" "geolocation=()" "$label"
  assert_header "$file" "X-Frame-Options" "DENY" "$label"
}

command -v curl >/dev/null 2>&1 || fail "curl is unavailable"
command -v node >/dev/null 2>&1 || fail "node is unavailable"
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum is unavailable"

printf '== Local Nginx gate ==\n'
nginx -t
systemctl is-active --quiet nginx
pass "Nginx configuration and service are healthy"

local_health_status="$(fetch GET \
  "https://www.flourishculturekol.com/api/contact/health" \
  "$WORK_DIR/local-health.headers" \
  "$WORK_DIR/local-health.json" \
  --resolve 'www.flourishculturekol.com:443:127.0.0.1')"
assert_status 200 "$local_health_status" "Loopback Contact health through Nginx"

printf '\n== Canonical redirects ==\n'
expected_probe="https://www.flourishculturekol.com/review/?probe=1"
apex_http_status="$(fetch GET \
  "http://flourishculturekol.com/review/?probe=1" \
  "$WORK_DIR/apex-http.headers" \
  "$WORK_DIR/apex-http.body")"
assert_status 301 "$apex_http_status" "Apex HTTP probe"
assert_location "$WORK_DIR/apex-http.headers" "$expected_probe" "Apex HTTP probe"

apex_https_status="$(fetch GET \
  "https://flourishculturekol.com/review/?probe=1" \
  "$WORK_DIR/apex-https.headers" \
  "$WORK_DIR/apex-https.body")"
assert_status 301 "$apex_https_status" "Apex HTTPS probe"
assert_location "$WORK_DIR/apex-https.headers" "$expected_probe" "Apex HTTPS probe"

www_http_status="$(fetch GET \
  "http://www.flourishculturekol.com/review/?probe=1" \
  "$WORK_DIR/www-http.headers" \
  "$WORK_DIR/www-http.body")"
assert_status 301 "$www_http_status" "www HTTP probe"
assert_location "$WORK_DIR/www-http.headers" "$expected_probe" "www HTTP probe"

printf '\n== Canonical static pages ==\n'
home_status="$(fetch GET \
  "https://www.flourishculturekol.com/" \
  "$WORK_DIR/home.headers" \
  "$WORK_DIR/index.html")"
assert_status 200 "$home_status" "www homepage"
assert_contains "$WORK_DIR/index.html" '<link rel="canonical" href="https://www.flourishculturekol.com/" />' "www homepage"
assert_header "$WORK_DIR/home.headers" "Content-Type" "text/html" "www homepage"
assert_page_headers "$WORK_DIR/home.headers" "www homepage"
assert_sha256 "$WORK_DIR/index.html" "37b42852eb54b4ca5c065fea48c912d95e7296149e7b62c512e5b38f136aeacb" "www homepage"

privacy_status="$(fetch GET \
  "https://www.flourishculturekol.com/privacy.html" \
  "$WORK_DIR/privacy.headers" \
  "$WORK_DIR/privacy.html")"
assert_status 200 "$privacy_status" "Privacy page"
assert_contains "$WORK_DIR/privacy.html" '<link rel="canonical" href="https://www.flourishculturekol.com/privacy.html" />' "Privacy page"
assert_header "$WORK_DIR/privacy.headers" "Content-Type" "text/html" "Privacy page"
assert_page_headers "$WORK_DIR/privacy.headers" "Privacy page"
assert_sha256 "$WORK_DIR/privacy.html" "ea1be315e5d0137d918d21a1fb7fff8ac0724057cb3c72ec7b0d1d5b40277f5a" "Privacy page"

printf '\n== Contact API ==\n'
health_status="$(fetch GET \
  "https://www.flourishculturekol.com/api/contact/health" \
  "$WORK_DIR/health.headers" \
  "$WORK_DIR/health.json")"
assert_status 200 "$health_status" "Public Contact health"
node -e '
  const fs = require("node:fs");
  const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (!(body.ok === true && body.configured === true && body.version === "1.2.0")) process.exit(1);
' "$WORK_DIR/health.json" || fail "Public Contact health JSON is not configured v1.2.0"
pass "Public Contact health JSON is configured v1.2.0"

config_status="$(fetch GET \
  "https://www.flourishculturekol.com/api/contact/config" \
  "$WORK_DIR/config.headers" \
  "$WORK_DIR/config.json")"
assert_status 200 "$config_status" "Public Contact config"
node -e '
  const fs = require("node:fs");
  const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const keys = Object.keys(body).sort();
  const expected = ["expiresAt", "formSessionToken", "turnstileSiteKey"];
  if (JSON.stringify(keys) !== JSON.stringify(expected)) process.exit(1);
  if (![body.turnstileSiteKey, body.formSessionToken, body.expiresAt].every((value) => typeof value === "string" && value.length > 0)) process.exit(1);
' "$WORK_DIR/config.json" || fail "Public Contact config is missing allowed fields or exposes an unexpected field"
pass "Public Contact config exposes only the three expected public fields"

post_status="$(fetch POST \
  "https://www.flourishculturekol.com/api/contact" \
  "$WORK_DIR/post.headers" \
  "$WORK_DIR/post.json" \
  --header 'Content-Type: application/json' \
  --data '{}')"
assert_status 403 "$post_status" "Contact POST without Origin"

printf '\n== Release files and MIME ==\n'
styles_status="$(fetch GET "$WWW_ORIGIN/styles.css" "$WORK_DIR/styles.headers" "$WORK_DIR/styles.css")"
assert_status 200 "$styles_status" "styles.css"
assert_header "$WORK_DIR/styles.headers" "Content-Type" "text/css" "styles.css"
assert_sha256 "$WORK_DIR/styles.css" "4e6903e9161f309c0aaa5d33e697d29798e6108e3eb5a54ffded0a4d96ea25d9" "styles.css"

script_status="$(fetch GET "$WWW_ORIGIN/script.js" "$WORK_DIR/script.headers" "$WORK_DIR/script.js")"
assert_status 200 "$script_status" "script.js"
assert_header "$WORK_DIR/script.headers" "Content-Type" "javascript" "script.js"
assert_sha256 "$WORK_DIR/script.js" "c6565c4b184b7a804ac3a882094de228faf45b9d50abfdb9070eebdb5b1368a7" "script.js"

contact_form_status="$(fetch GET "$WWW_ORIGIN/contact-form.js" "$WORK_DIR/contact-form.headers" "$WORK_DIR/contact-form.js")"
assert_status 200 "$contact_form_status" "contact-form.js"
assert_header "$WORK_DIR/contact-form.headers" "Content-Type" "javascript" "contact-form.js"
assert_sha256 "$WORK_DIR/contact-form.js" "469f839535c4b8fefcecf7b8de61b9502cd06556a1a5fb89e2a1804ba68c96b2" "contact-form.js"

site_core_status="$(fetch GET "$WWW_ORIGIN/site-core.js" "$WORK_DIR/site-core.headers" "$WORK_DIR/site-core.js")"
assert_status 200 "$site_core_status" "site-core.js"
assert_header "$WORK_DIR/site-core.headers" "Content-Type" "javascript" "site-core.js"
assert_sha256 "$WORK_DIR/site-core.js" "b8fe43f1ed63cdd3a643db6bf9d11ca282601fb7c94d1d113f5f76a8c2f6d24e" "site-core.js"

service_image_status="$(fetch GET \
  "$WWW_ORIGIN/assets/service-creative-localization-meetup.webp" \
  "$WORK_DIR/service-image.headers" \
  "$WORK_DIR/service-image.webp")"
assert_status 200 "$service_image_status" "Service 03 image"
assert_header "$WORK_DIR/service-image.headers" "Content-Type" "image/webp" "Service 03 image"
assert_sha256 "$WORK_DIR/service-image.webp" "995033f01f8c240270f1262760d61a43a3e57d2a13ca71ab6a5d048b465481ab" "Service 03 image"

talent_image_status="$(fetch GET \
  "$WWW_ORIGIN/assets/talent-creator-growth-studio.webp" \
  "$WORK_DIR/talent-image.headers" \
  "$WORK_DIR/talent-image.webp")"
assert_status 200 "$talent_image_status" "Our Talent image"
assert_header "$WORK_DIR/talent-image.headers" "Content-Type" "image/webp" "Our Talent image"
assert_sha256 "$WORK_DIR/talent-image.webp" "f9187abb6213fdd05725f0db3cf45551619465cea9b3758dfe8863b3e4fceed2" "Our Talent image"

printf '\n== Existing /review/ application ==\n'
review_health_status="$(fetch GET \
  "https://www.flourishculturekol.com/review/healthz" \
  "$WORK_DIR/review-health.headers" \
  "$WORK_DIR/review-health.json")"
assert_status 200 "$review_health_status" "/review/healthz"
node -e '
  const fs = require("node:fs");
  JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
' "$WORK_DIR/review-health.json" || fail "/review/healthz did not return valid JSON"
pass "/review/healthz returned valid JSON"

review_status="$(fetch GET \
  "https://www.flourishculturekol.com/review/" \
  "$WORK_DIR/review.headers" \
  "$WORK_DIR/review.body")"
assert_status 302 "$review_status" "/review/"
assert_location "$WORK_DIR/review.headers" "/review/login" "/review/"

printf '\nAll FLOURISH v1.2.0 production checks passed.\n'
