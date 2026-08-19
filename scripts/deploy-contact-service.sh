#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ARCHIVE_SAFETY_HELPER="${SCRIPT_DIR}/archive-safety.sh"
CONTACT_ROOT="/opt/flourish-contact"
RELEASES_ROOT="$CONTACT_ROOT/releases"
CURRENT_LINK="$CONTACT_ROOT/current"
RUNTIME_LINK="$CONTACT_ROOT/runtime"
HEALTH_URL="http://127.0.0.1:3101/api/contact/health"
SERVICE_NAME="flourish-contact"
STAGE=""
PREVIOUS_RELEASE_TARGET=""
PREVIOUS_RUNTIME_TARGET=""
HAD_PREVIOUS_RELEASE=0
HAD_PREVIOUS_RUNTIME=0
LINKS_MUTATED=0

fail() {
  echo "$1" >&2
  exit 1
}

cleanup() {
  if [[ -n "$STAGE" && -d "$STAGE" ]]; then
    rm -rf "$STAGE"
  fi
  rm -f \
    "${CURRENT_LINK}.next" \
    "${CURRENT_LINK}.rollback" \
    "${RUNTIME_LINK}.next" \
    "${RUNTIME_LINK}.rollback"
}

restore_link() {
  local link="$1"
  local previous_target="$2"
  local had_previous="$3"

  if (( had_previous == 1 )); then
    ln -s "$previous_target" "${link}.rollback"
    mv -Tf "${link}.rollback" "$link"
  else
    rm -f "$link"
  fi
}

rollback() {
  local exit_code=$?
  trap - ERR
  if (( LINKS_MUTATED == 1 )); then
    echo "Contact service health check failed; restoring previous release and runtime symlinks." >&2
    restore_link "$CURRENT_LINK" "$PREVIOUS_RELEASE_TARGET" "$HAD_PREVIOUS_RELEASE" || true
    restore_link "$RUNTIME_LINK" "$PREVIOUS_RUNTIME_TARGET" "$HAD_PREVIOUS_RUNTIME" || true
    if (( HAD_PREVIOUS_RELEASE == 1 && HAD_PREVIOUS_RUNTIME == 1 )); then
      systemctl restart "$SERVICE_NAME" || true
    else
      systemctl stop "$SERVICE_NAME" || true
    fi
  fi
  cleanup
  exit "$exit_code"
}

trap cleanup EXIT
trap rollback ERR

[[ -f "$ARCHIVE_SAFETY_HELPER" && ! -L "$ARCHIVE_SAFETY_HELPER" ]] ||
  fail "Required archive safety helper is missing or unsafe."
# shellcheck source=archive-safety.sh
source "$ARCHIVE_SAFETY_HELPER"
declare -F archive_members_are_safe >/dev/null ||
  fail "Required archive safety helper is unavailable."

[[ $# -eq 2 ]] || fail "Usage: $0 /absolute/path/to/flourish-contact-service.tgz /absolute/path/to/node-runtime"
[[ $EUID -eq 0 ]] || fail "Run this deployment script as root."

ARCHIVE="$1"
RUNTIME_TARGET="$2"
[[ -f "$ARCHIVE" ]] || fail "Contact service archive not found: $ARCHIVE"
[[ "$RUNTIME_TARGET" = /* ]] || fail "Node runtime path must be absolute: $RUNTIME_TARGET"
[[ -d "$RUNTIME_TARGET" ]] || fail "Node runtime directory not found: $RUNTIME_TARGET"
RUNTIME_TARGET="$(readlink -f "$RUNTIME_TARGET")"
[[ -x "$RUNTIME_TARGET/bin/node" ]] || fail "Node executable not found: $RUNTIME_TARGET/bin/node"
[[ -x "$RUNTIME_TARGET/bin/npm" ]] || fail "npm executable not found: $RUNTIME_TARGET/bin/npm"
[[ -f /etc/flourish-contact.env ]] || fail "Protected environment file is missing: /etc/flourish-contact.env"
id -u flourish-contact >/dev/null 2>&1 || fail "System user flourish-contact does not exist."

for command in tar curl systemctl find install readlink timeout env; do
  command -v "$command" >/dev/null 2>&1 || fail "Required command is unavailable: $command"
done

NODE_MAJOR="$("$RUNTIME_TARGET/bin/node" -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] || fail "Unable to determine the Node.js major version."
(( NODE_MAJOR >= 20 )) || fail "Node.js 20 or newer is required; found major version $NODE_MAJOR."
timeout -k 1 10 env \
  PATH="$RUNTIME_TARGET/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  "$RUNTIME_TARGET/bin/npm" --version >/dev/null

archive_members_are_safe < <(tar -tzf "$ARCHIVE")

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
  env \
    PATH="$RUNTIME_TARGET/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
    "$RUNTIME_TARGET/bin/npm" ci --omit=dev --ignore-scripts --no-audit --no-fund
)

chown -R root:flourish-contact "$RELEASE_DIR"
find "$RELEASE_DIR" -type d -exec chmod 0750 {} +
find "$RELEASE_DIR" -type f -exec chmod 0640 {} +

if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE_TARGET="$(readlink "$CURRENT_LINK")"
  HAD_PREVIOUS_RELEASE=1
elif [[ -e "$CURRENT_LINK" ]]; then
  fail "Current path exists but is not a symlink: $CURRENT_LINK"
fi
if [[ -L "$RUNTIME_LINK" ]]; then
  PREVIOUS_RUNTIME_TARGET="$(readlink "$RUNTIME_LINK")"
  HAD_PREVIOUS_RUNTIME=1
elif [[ -e "$RUNTIME_LINK" ]]; then
  fail "Runtime path exists but is not a symlink: $RUNTIME_LINK"
fi

ln -s "$RELEASE_DIR" "${CURRENT_LINK}.next"
ln -s "$RUNTIME_TARGET" "${RUNTIME_LINK}.next"
LINKS_MUTATED=1
mv -Tf "${CURRENT_LINK}.next" "$CURRENT_LINK"
mv -Tf "${RUNTIME_LINK}.next" "$RUNTIME_LINK"
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

LINKS_MUTATED=0
trap - ERR
echo "Contact service release activated: $RELEASE_DIR"
echo "Current symlink: $CURRENT_LINK -> $(readlink "$CURRENT_LINK")"
echo "Runtime symlink: $RUNTIME_LINK -> $(readlink "$RUNTIME_LINK")"
if (( HAD_PREVIOUS_RELEASE == 1 )); then
  echo "Previous release retained for rollback: $PREVIOUS_RELEASE_TARGET"
else
  echo "No previous release symlink was present."
fi
if (( HAD_PREVIOUS_RUNTIME == 1 )); then
  echo "Previous runtime retained for rollback: $PREVIOUS_RUNTIME_TARGET"
else
  echo "No previous runtime symlink was present."
fi
