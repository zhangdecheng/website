#!/usr/bin/env bash

archive_members_are_safe() {
  local member
  local normalized

  while IFS= read -r member; do
    case "$member" in
      .|./)
        continue
        ;;
    esac

    normalized="${member#./}"
    case "$normalized" in
      ""|/*|../*|*/../*|*/..)
        printf 'Unsafe archive member: %s\n' "$member" >&2
        return 1
        ;;
    esac
  done
}
