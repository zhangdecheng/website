#!/bin/bash
set -euo pipefail
umask 077
export TZ=UTC
export COPYFILE_DISABLE=1

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
readonly RELEASE_DIR="${PROJECT_ROOT}/release"
readonly ARCHIVE_NAME="flourish-production-transfer-v1.2.0.tgz"
readonly OUTPUT_PATH="${RELEASE_DIR}/${ARCHIVE_NAME}"

readonly -a PAYLOAD=(
  "check-https-cloud-assistant.sh"
  "deploy-cloud-assistant.sh"
  "ops/flourish-contact.service"
  "ops/nginx/flourish-contact-api.conf"
  "release/flourish-contact-service.tgz"
  "release/flourishculturekol-homepage.zip"
  "scripts/archive-safety.sh"
  "scripts/configure-contact-env.sh"
  "scripts/deploy-contact-service.sh"
  "scripts/rotate-contact-turnstile.sh"
  "scripts/systemd-env.sh"
)

build_dir=""

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

cleanup() {
  local exit_status=$?
  if [[ -n "${build_dir}" ]]; then
    case "${build_dir}" in
      "${RELEASE_DIR}"/.transfer-build.*)
        /usr/bin/find "${build_dir}" -depth -delete 2>/dev/null || true
        ;;
    esac
  fi
  exit "${exit_status}"
}
trap cleanup EXIT

for required_command in /bin/cp /bin/mkdir /usr/bin/dirname /usr/bin/find /usr/bin/gzip /usr/bin/python3 /usr/bin/shasum /usr/bin/sort; do
  [[ -x "${required_command}" ]] || fail "missing required command: ${required_command}"
done
[[ -f "${SCRIPT_DIR}/create-deterministic-tar.py" ]] || fail "deterministic tar helper is missing"

[[ -d "${RELEASE_DIR}" && ! -L "${RELEASE_DIR}" ]] || fail "release directory is missing or unsafe"

for relative_file in "${PAYLOAD[@]}"; do
  absolute_file="${PROJECT_ROOT}/${relative_file}"
  [[ -f "${absolute_file}" && ! -L "${absolute_file}" ]] || fail "missing or unsafe input: ${relative_file}"
done

(
  cd "${PROJECT_ROOT}"
  /usr/bin/shasum -a 256 "${PAYLOAD[@]}" >release/SHA256SUMS.next
  /bin/mv -- release/SHA256SUMS.next release/SHA256SUMS
  /usr/bin/shasum -a 256 -c release/SHA256SUMS >/dev/null
) || fail "inner release checksum generation or verification failed"

build_dir="$(/usr/bin/mktemp -d "${RELEASE_DIR}/.transfer-build.XXXXXX")"
candidate_path="${build_dir}/${ARCHIVE_NAME}"
candidate_tar_path="${build_dir}/flourish-production-transfer-v1.2.0.tar"
payload_root="${build_dir}/payload"
inventory_list="${build_dir}/inventory.txt"

/bin/mkdir -p "${payload_root}"
printf '%s\n' "release/SHA256SUMS" "${PAYLOAD[@]}" | LC_ALL=C /usr/bin/sort >"${inventory_list}"
inventory_count="$(/usr/bin/wc -l <"${inventory_list}" | /usr/bin/tr -d '[:space:]')"
[[ "${inventory_count}" == "12" ]] || fail "unexpected transfer inventory count"
while IFS= read -r relative_file; do
  target_file="${payload_root}/${relative_file}"
  /bin/mkdir -p "$(/usr/bin/dirname "${target_file}")"
  /bin/cp -p -- "${PROJECT_ROOT}/${relative_file}" "${target_file}"
done <"${inventory_list}"

/usr/bin/python3 "${SCRIPT_DIR}/create-deterministic-tar.py" \
  "${payload_root}" "${candidate_tar_path}" "${inventory_list}"
/usr/bin/gzip -n -9 < "${candidate_tar_path}" > "${candidate_path}"

/usr/bin/python3 - "${candidate_path}" "${inventory_list}" <<'PY'
import sys
import tarfile

archive_path, inventory_path = sys.argv[1:]
with open(inventory_path, encoding="utf-8") as inventory:
    expected = [line.rstrip("\n") for line in inventory]
with tarfile.open(archive_path, "r:gz") as archive:
    members = archive.getmembers()

actual = [member.name for member in members]
if actual != expected:
    raise SystemExit(f"unexpected transfer inventory: {actual!r}")
if any(not member.isfile() for member in members):
    raise SystemExit("transfer archive contains a non-regular entry")
if any(any("xattr" in key.lower() for key in member.pax_headers) for member in members):
    raise SystemExit("transfer archive contains xattr headers")
PY

archive_sha256="$(/usr/bin/shasum -a 256 "${candidate_path}" | /usr/bin/awk '{ print $1 }')"
archive_bytes="$(/usr/bin/wc -c < "${candidate_path}" | /usr/bin/tr -d '[:space:]')"

/bin/mv -- "${candidate_path}" "${OUTPUT_PATH}"

printf 'Transfer archive: %s\n' "${OUTPUT_PATH}"
printf 'SHA-256: %s\n' "${archive_sha256}"
printf 'Bytes: %s\n' "${archive_bytes}"
printf 'Entries: %s regular files\n' "${inventory_count}"
