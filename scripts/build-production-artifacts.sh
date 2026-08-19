#!/bin/bash
set -euo pipefail
umask 077

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
readonly RELEASE_DIR="${PROJECT_ROOT}/release"
readonly DIST_DIR="${PROJECT_ROOT}/dist"
readonly CONTACT_DIR="${RELEASE_DIR}/contact-service"
readonly STATIC_OUTPUT="${RELEASE_DIR}/flourishculturekol-homepage.zip"
readonly CONTACT_OUTPUT="${RELEASE_DIR}/flourish-contact-service.tgz"

build_dir=""

die() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

cleanup() {
  local exit_status=$?
  if [[ -n "$build_dir" ]]; then
    case "$build_dir" in
      "${RELEASE_DIR}"/.artifact-build.*)
        /usr/bin/find "$build_dir" -depth -delete 2>/dev/null || true
        ;;
    esac
  fi
  exit "$exit_status"
}
trap cleanup EXIT

for command in /usr/bin/find /usr/bin/gzip /usr/bin/mktemp /usr/bin/python3 /usr/bin/shasum /usr/bin/tar /usr/bin/zip; do
  [[ -x "$command" ]] || die "missing required command: $command"
done
command -v node >/dev/null 2>&1 || die "node is unavailable"

(cd "$PROJECT_ROOT" && node scripts/build-release.mjs >/dev/null)
(cd "$PROJECT_ROOT" && node scripts/build-contact-release.mjs >/dev/null)

[[ -d "$DIST_DIR" && ! -L "$DIST_DIR" ]] || die "static build directory is missing or unsafe"
[[ -d "$CONTACT_DIR" && ! -L "$CONTACT_DIR" ]] || die "contact build directory is missing or unsafe"
[[ -z "$(/usr/bin/find "$DIST_DIR" "$CONTACT_DIR" -type l -print -quit)" ]] || die "release inputs contain a symlink"

for required in index.html privacy.html styles.css script.js contact-form.js site-core.js assets; do
  [[ -e "${DIST_DIR}/${required}" ]] || die "static build is missing: $required"
done
for required in package.json package-lock.json ops/flourish-contact.service server/index.js server/smtp-check.js; do
  [[ -f "${CONTACT_DIR}/${required}" ]] || die "contact build is missing: $required"
done

build_dir="$(/usr/bin/mktemp -d "${RELEASE_DIR}/.artifact-build.XXXXXX")"
static_candidate="${build_dir}/flourishculturekol-homepage.zip"
contact_tar="${build_dir}/flourish-contact-service.tar"
contact_candidate="${build_dir}/flourish-contact-service.tgz"
contact_list="${build_dir}/contact-files.txt"

(
  cd "$DIST_DIR"
  COPYFILE_DISABLE=1 /usr/bin/zip -X -q -r "$static_candidate" .
)

(
  cd "$CONTACT_DIR"
  {
    printf '%s\n' package-lock.json package.json
    /usr/bin/find ops server -type f -print
  } | LC_ALL=C /usr/bin/sort >"$contact_list"
  COPYFILE_DISABLE=1 /usr/bin/tar --format ustar --no-xattrs -cf "$contact_tar" -T "$contact_list"
)
/usr/bin/gzip -n -9 <"$contact_tar" >"$contact_candidate"

/usr/bin/python3 - "$static_candidate" "$contact_candidate" <<'PY'
import sys
import tarfile
import zipfile

static_path, contact_path = sys.argv[1:]

with zipfile.ZipFile(static_path) as archive:
    names = archive.namelist()
    if not names:
        raise SystemExit("static archive is empty")
    for name in names:
        normalized = name.rstrip("/")
        parts = normalized.split("/") if normalized else []
        if name.startswith("/") or ".." in parts:
            raise SystemExit(f"unsafe static archive member: {name}")
        if any(part == "__MACOSX" or part == ".DS_Store" or part.startswith("._") for part in parts):
            raise SystemExit(f"macOS metadata in static archive: {name}")

with tarfile.open(contact_path, "r:gz") as archive:
    members = archive.getmembers()
    if not members or any(not member.isfile() for member in members):
        raise SystemExit("contact archive must contain regular files only")
    for member in members:
        if member.name in {".", "./"} or member.name.startswith("/") or ".." in member.name.split("/"):
            raise SystemExit(f"unsafe contact archive member: {member.name}")
        if any("xattr" in key.lower() for key in member.pax_headers):
            raise SystemExit(f"xattr header in contact archive: {member.name}")
    top_levels = {member.name.split("/", 1)[0] for member in members}
    if top_levels != {"ops", "package-lock.json", "package.json", "server"}:
        raise SystemExit(f"unexpected contact top levels: {sorted(top_levels)}")
PY

/bin/mv -- "$static_candidate" "$STATIC_OUTPUT"
/bin/mv -- "$contact_candidate" "$CONTACT_OUTPUT"

printf 'Static archive SHA-256: %s\n' "$(/usr/bin/shasum -a 256 "$STATIC_OUTPUT" | /usr/bin/awk '{ print $1 }')"
printf 'Contact archive SHA-256: %s\n' "$(/usr/bin/shasum -a 256 "$CONTACT_OUTPUT" | /usr/bin/awk '{ print $1 }')"
