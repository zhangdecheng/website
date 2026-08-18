#!/usr/bin/env bash
set -euo pipefail

CONTACT_ROOT="/opt/flourish-contact"
RELEASES_ROOT="$CONTACT_ROOT/releases"
CURRENT_LINK="$CONTACT_ROOT/current"
HEALTH_URL="http://127.0.0.1:3101/api/contact/health"
SERVICE_NAME="flourish-contact"
STAGE=""
PREVIOUS_TARGET=""
ACTIVATED=0

fail() {
  echo "$1" >&2
  exit 1
}

cleanup() {
  if [[ -n "$STAGE" && -d "$STAGE" ]]; then
    rm -rf "$STAGE"
  fi
  rm -f "${CURRENT_LINK}.next" "${CURRENT_LINK}.rollback"
}

rollback() {
  local exit_code=$?
  trap - ERR
  if (( ACTIVATED == 1 )); then
    echo "Contact service health check failed; restoring the previous current symlink." >&2
    if [[ -n "$PREVIOUS_TARGET" ]]; then
      ln -s "$PREVIOUS_TARGET" "${CURRENT_LINK}.rollback"
      mv -Tf "${CURRENT_LINK}.rollback" "$CURRENT_LINK"
      systemctl restart "$SERVICE_NAME" || true
    else
      rm -f "$CURRENT_LINK"
      systemctl stop "$SERVICE_NAME" || true
    fi
  fi
  cleanup
  exit "$exit_code"
}

trap cleanup EXIT
trap rollback ERR

[[ $# -eq 1 ]] || fail "Usage: $0 /absolute/path/to/flourish-contact-service.tgz"
[[ $EUID -eq 0 ]] || fail "Run this deployment script as root."

ARCHIVE="$1"
[[ -f "$ARCHIVE" ]] || fail "Contact service archive not found: $ARCHIVE"
[[ -f /etc/flourish-contact.env ]] || fail "Protected environment file is missing: /etc/flourish-contact.env"
id -u flourish-contact >/dev/null 2>&1 || fail "System user flourish-contact does not exist."

for command in node npm tar curl systemctl find install; do
  command -v "$command" >/dev/null 2>&1 || fail "Required command is unavailable: $command"
done

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] || fail "Unable to determine the Node.js major version."
(( NODE_MAJOR >= 20 )) || fail "Node.js 20 or newer is required; found major version $NODE_MAJOR."

while IFS= read -r member; do
  normalized="${member#./}"
  case "$normalized" in
    ""|/*|../*|*/../*|*/..)
      fail "Unsafe archive member: $member"
      ;;
  esac
done < <(tar -tzf "$ARCHIVE")

STAGE="$(mktemp -d)"
tar -xzf "$ARCHIVE" -C "$STAGE"

if [[ -n "$(find "$STAGE" -type l -print -quit)" ]]; then
  fail "Contact service archive must not contain symlinks."
fi
if [[ -n "$(find "$STAGE" -type f \( -iname '.env' -o -iname '.env.*' -o -iname '*secret*' -o -iname '*token*' -o -iname '*.pem' -o -iname '*.key' -o -iname '*.log' \) -print -quit)" ]]; then
  fail "Contact service archive contains a forbidden filename."
fi

for required in \
  package.json \
  package-lock.json \
  ops/flourish-contact.service \
  server/index.js \
  server/smtp-check.js \
  server/contact/config.js; do
  [[ -f "$STAGE/$required" ]] || fail "Contact service archive is missing: $required"
done

while IFS= read -r top_level; do
  case "$top_level" in
    ops|package.json|package-lock.json|server) ;;
    *) fail "Unexpected top-level release entry: $top_level" ;;
  esac
done < <(find "$STAGE" -mindepth 1 -maxdepth 1 -exec basename {} \; | sort)

install -d -o root -g flourish-contact -m 0750 "$CONTACT_ROOT" "$RELEASES_ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="$RELEASES_ROOT/$STAMP"
[[ ! -e "$RELEASE_DIR" ]] || fail "Release directory already exists: $RELEASE_DIR"
install -d -o root -g flourish-contact -m 0750 "$RELEASE_DIR"
cp -a "$STAGE/." "$RELEASE_DIR/"

(
  cd "$RELEASE_DIR"
  npm ci --omit=dev --ignore-scripts --no-audit --no-fund
)

chown -R root:flourish-contact "$RELEASE_DIR"
find "$RELEASE_DIR" -type d -exec chmod 0750 {} +
find "$RELEASE_DIR" -type f -exec chmod 0640 {} +

if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_TARGET="$(readlink "$CURRENT_LINK")"
elif [[ -e "$CURRENT_LINK" ]]; then
  fail "Current path exists but is not a symlink: $CURRENT_LINK"
fi

ln -s "$RELEASE_DIR" "${CURRENT_LINK}.next"
mv -Tf "${CURRENT_LINK}.next" "$CURRENT_LINK"
ACTIVATED=1
systemctl restart "$SERVICE_NAME"

healthy=0
for _attempt in {1..30}; do
  if curl -fsS --max-time 2 "$HEALTH_URL" >/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
(( healthy == 1 )) || false
systemctl is-active --quiet "$SERVICE_NAME"

ACTIVATED=0
trap - ERR
echo "Contact service release activated: $RELEASE_DIR"
echo "Current symlink: $CURRENT_LINK -> $(readlink "$CURRENT_LINK")"
if [[ -n "$PREVIOUS_TARGET" ]]; then
  echo "Previous release retained for rollback: $PREVIOUS_TARGET"
else
  echo "No previous release symlink was present."
fi
