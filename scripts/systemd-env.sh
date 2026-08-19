#!/usr/bin/env bash

systemd_env_assignment() {
  [[ $# -eq 2 ]] || return 64

  local name="$1"
  local value="$2"

  [[ "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || return 65
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || return 66

  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//\$/\\\$}"
  value="${value//\`/\\\`}"

  printf '%s="%s"\n' "$name" "$value"
}
