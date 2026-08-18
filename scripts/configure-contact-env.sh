#!/usr/bin/env bash
set -euo pipefail

TARGET="/etc/flourish-contact.env"
GROUP="flourish-contact"
STAGE=""
SITE_KEY=""
TURNSTILE_SECRET=""
TURNSTILE_SECRET_CONFIRM=""
SMTP_PASSWORD=""
SMTP_PASSWORD_CONFIRM=""
CONTACT_SECURITY_SECRET=""

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

cleanup() {
  unset \
    SITE_KEY \
    TURNSTILE_SECRET \
    TURNSTILE_SECRET_CONFIRM \
    SMTP_PASSWORD \
    SMTP_PASSWORD_CONFIRM \
    CONTACT_SECURITY_SECRET
  if [[ -n "$STAGE" && -e "$STAGE" ]]; then
    rm -f -- "$STAGE"
  fi
}

prompt_secret() {
  local prompt="$1"
  local confirm_prompt="$2"
  local value_name="$3"
  local confirm_name="$4"

  printf '%s' "$prompt" >&2
  IFS= read -r -s "$value_name"
  printf '\n%s' "$confirm_prompt" >&2
  IFS= read -r -s "$confirm_name"
  printf '\n' >&2
}

validate_length() {
  local label="$1"
  local value="$2"
  local minimum="$3"
  local maximum="$4"
  local length="${#value}"

  (( length >= minimum && length <= maximum )) ||
    fail "$label must be between $minimum and $maximum characters."
}

trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

[[ $# -eq 0 ]] || fail "Usage: sudo bash scripts/configure-contact-env.sh"
[[ $EUID -eq 0 ]] || fail "Run this script as root from a private interactive terminal."
[[ -t 0 ]] || fail "Standard input must be a private interactive terminal."
[[ -t 1 ]] || fail "Standard output must be a private interactive terminal."
[[ ! -e "$TARGET" && ! -L "$TARGET" ]] || fail "$TARGET already exists; refusing to overwrite protected credentials."
getent group "$GROUP" >/dev/null 2>&1 || fail "Required group does not exist: $GROUP"

for command in chown chmod getent ln mktemp openssl rm; do
  command -v "$command" >/dev/null 2>&1 || fail "Required command is unavailable: $command"
done

printf 'Cloudflare Turnstile Site Key (public identifier): ' >&2
IFS= read -r SITE_KEY
prompt_secret \
  'Cloudflare Turnstile Secret Key (hidden): ' \
  'Repeat Turnstile Secret Key (hidden): ' \
  TURNSTILE_SECRET \
  TURNSTILE_SECRET_CONFIRM
prompt_secret \
  'SMTP authorization code for business@flourish-culture.com (hidden): ' \
  'Repeat SMTP authorization code (hidden): ' \
  SMTP_PASSWORD \
  SMTP_PASSWORD_CONFIRM

[[ "$TURNSTILE_SECRET" == "$TURNSTILE_SECRET_CONFIRM" ]] ||
  fail "Turnstile Secret Key entries do not match."
[[ "$SMTP_PASSWORD" == "$SMTP_PASSWORD_CONFIRM" ]] ||
  fail "SMTP authorization code entries do not match."

validate_length "Turnstile Site Key" "$SITE_KEY" 8 128
validate_length "Turnstile Secret Key" "$TURNSTILE_SECRET" 16 512
validate_length "SMTP authorization code" "$SMTP_PASSWORD" 8 512

TOKEN_PATTERN='^[A-Za-z0-9._-]+$'
ENV_VALUE_PATTERN='^[A-Za-z0-9._~!$%^&*+=,:@/-]+$'
[[ "$SITE_KEY" =~ $TOKEN_PATTERN ]] || fail "Turnstile Site Key contains unsupported characters."
[[ "$TURNSTILE_SECRET" =~ $TOKEN_PATTERN ]] || fail "Turnstile Secret Key contains unsupported characters."
[[ "$SMTP_PASSWORD" =~ $ENV_VALUE_PATTERN ]] || fail "SMTP authorization code contains characters unsafe for a systemd environment file."

CONTACT_SECURITY_SECRET="$(openssl rand -hex 48)"
[[ "$CONTACT_SECURITY_SECRET" =~ ^[a-f0-9]{96}$ ]] || fail "Unable to generate the Contact security secret."

umask 0077
STAGE="$(mktemp /etc/.flourish-contact.env.XXXXXX)"
{
  printf '%s\n' \
    "CONTACT_PORT=3101" \
    "CONTACT_TURNSTILE_SITE_KEY=$SITE_KEY" \
    "CONTACT_TURNSTILE_SECRET=$TURNSTILE_SECRET" \
    "CONTACT_SECURITY_SECRET=$CONTACT_SECURITY_SECRET" \
    "SMTP_HOST=smtp.yunyou.top" \
    "SMTP_PORT=465" \
    "SMTP_USER=business@flourish-culture.com" \
    "SMTP_PASSWORD=$SMTP_PASSWORD"
} >"$STAGE"

chown root:"$GROUP" "$STAGE"
chmod 0640 "$STAGE"
ln "$STAGE" "$TARGET" || fail "$TARGET appeared during setup; refusing to overwrite it."
rm -f -- "$STAGE"
STAGE=""

printf 'Protected Contact environment created. Values are not displayed.\n'
printf 'root:%s 640 %s\n' "$GROUP" "$TARGET"
for key in \
  CONTACT_PORT \
  CONTACT_TURNSTILE_SITE_KEY \
  CONTACT_TURNSTILE_SECRET \
  CONTACT_SECURITY_SECRET \
  SMTP_HOST \
  SMTP_PORT \
  SMTP_USER \
  SMTP_PASSWORD; do
  printf '%s=set\n' "$key"
done
