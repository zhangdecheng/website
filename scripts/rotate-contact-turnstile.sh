#!/usr/bin/env bash
set -euo pipefail
umask 0077

TARGET="/etc/flourish-contact.env"
GROUP="flourish-contact"
SERVICE="flourish-contact.service"
HEALTH_URL="http://127.0.0.1:3101/api/contact/health"
STAGE=""
ROLLBACK=""
TARGET_REPLACED=0
TURNSTILE_SECRET=""
TURNSTILE_SECRET_CONFIRM=""

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

cleanup() {
  local exit_code=$?
  trap - EXIT HUP INT TERM
  set +e
  unset TURNSTILE_SECRET TURNSTILE_SECRET_CONFIRM
  if [[ -n "$STAGE" && -e "$STAGE" ]]; then
    rm -f -- "$STAGE"
  fi
  if (( TARGET_REPLACED == 1 )); then
    rollback
  elif [[ -n "$ROLLBACK" && -e "$ROLLBACK" ]]; then
    rm -f -- "$ROLLBACK"
  fi
  exit "$exit_code"
}

rollback() {
  if (( TARGET_REPLACED == 1 )) && [[ -n "$ROLLBACK" && -f "$ROLLBACK" ]]; then
    printf '%s\n' 'Turnstile Secret update failed; restoring the previous protected environment.' >&2
    if mv -f -- "$ROLLBACK" "$TARGET"; then
      ROLLBACK=""
      TARGET_REPLACED=0
      chown root:"$GROUP" "$TARGET" || true
      chmod 0640 "$TARGET" || true
      systemctl restart "$SERVICE" || true
    else
      printf 'Automatic rollback failed; protected backup retained at %s\n' "$ROLLBACK" >&2
    fi
  elif (( TARGET_REPLACED == 1 )); then
    printf '%s\n' 'Automatic rollback could not start because the protected backup is missing.' >&2
  fi
}

trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

[[ $# -eq 0 ]] || fail "Usage: sudo bash scripts/rotate-contact-turnstile.sh"
[[ $EUID -eq 0 ]] || fail "Run this script as root from a private interactive terminal."
[[ -t 0 ]] || fail "Standard input must be a private interactive terminal."
[[ -t 1 ]] || fail "Standard output must be a private interactive terminal."
[[ -f "$TARGET" && ! -L "$TARGET" ]] || fail "Protected environment file is missing or unsafe."
[[ "$(stat -c '%U:%G %a' "$TARGET")" == "root:$GROUP 640" ]] ||
  fail "Protected environment owner or mode is unexpected."

for command in awk chown chmod cp curl mktemp mv rm sleep stat systemctl sync; do
  command -v "$command" >/dev/null 2>&1 || fail "Required command is unavailable: $command"
done

for key in \
  CONTACT_PORT \
  CONTACT_TURNSTILE_SITE_KEY \
  CONTACT_TURNSTILE_SECRET \
  CONTACT_SECURITY_SECRET \
  SMTP_HOST \
  SMTP_PORT \
  SMTP_USER \
  SMTP_PASSWORD; do
  count="$(awk -F= -v expected="$key" '$1 == expected { count += 1 } END { print count + 0 }' "$TARGET")"
  [[ "$count" == "1" ]] || fail "Protected environment must contain exactly one $key assignment."
done

printf '%s' 'Cloudflare Turnstile Secret Key (hidden): ' >&2
IFS= read -r -s TURNSTILE_SECRET
printf '\n%s' 'Repeat Turnstile Secret Key (hidden): ' >&2
IFS= read -r -s TURNSTILE_SECRET_CONFIRM
printf '\n' >&2

[[ "$TURNSTILE_SECRET" == "$TURNSTILE_SECRET_CONFIRM" ]] ||
  fail "Turnstile Secret Key entries do not match."
(( ${#TURNSTILE_SECRET} >= 16 && ${#TURNSTILE_SECRET} <= 512 )) ||
  fail "Turnstile Secret Key must be between 16 and 512 characters."
TOKEN_PATTERN='^[A-Za-z0-9._-]+$'
[[ "$TURNSTILE_SECRET" =~ $TOKEN_PATTERN ]] ||
  fail "Turnstile Secret Key contains unsupported characters."

STAGE="$(mktemp /etc/.flourish-contact.env.update.XXXXXX)"
ROLLBACK="$(mktemp /etc/.flourish-contact.env.rollback.XXXXXX)"
cp --preserve=mode,ownership -- "$TARGET" "$ROLLBACK"

replacement_count=0
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    CONTACT_TURNSTILE_SECRET=*)
      printf 'CONTACT_TURNSTILE_SECRET=%s\n' "$TURNSTILE_SECRET"
      replacement_count=$((replacement_count + 1))
      ;;
    *)
      printf '%s\n' "$line"
      ;;
  esac
done <"$TARGET" >"$STAGE"

[[ "$replacement_count" == "1" ]] || fail "Turnstile Secret assignment replacement was not unique."
chown root:"$GROUP" "$STAGE" "$ROLLBACK"
chmod 0640 "$STAGE" "$ROLLBACK"
sync -f "$STAGE"

TARGET_REPLACED=1
mv -f -- "$STAGE" "$TARGET"
STAGE=""
systemctl restart "$SERVICE"

healthy=0
for _attempt in {1..30}; do
  if curl -fsS --max-time 2 "$HEALTH_URL" >/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
(( healthy == 1 )) || false
systemctl is-active --quiet "$SERVICE"

TARGET_REPLACED=0
rm -f -- "$ROLLBACK"
ROLLBACK=""

printf '%s\n' 'Protected Turnstile Secret updated. Values are not displayed.'
printf 'root:%s 640 %s\n' "$GROUP" "$TARGET"
printf '%s\n' 'CONTACT_TURNSTILE_SECRET=set'
