#!/usr/bin/env python3
"""Create a portable, deterministic ustar archive from an explicit file list."""

from __future__ import annotations

import os
from pathlib import PurePosixPath
import stat
import sys
import tarfile


FIXED_MTIME = 315532800  # 1980-01-01T00:00:00Z


def fail(message: str) -> "None":
    raise SystemExit(f"ERROR: {message}")


def main() -> None:
    if len(sys.argv) != 4:
        fail("usage: create-deterministic-tar.py ROOT OUTPUT_TAR FILE_LIST")

    root, output_path, list_path = map(os.path.abspath, sys.argv[1:])
    with open(list_path, encoding="utf-8") as file_list:
        names = [line.rstrip("\n") for line in file_list]

    if not names or any(not name for name in names):
        fail("file list must contain non-empty paths")
    if names != sorted(names):
        fail("file list must be canonically sorted")
    if len(names) != len(set(names)):
        fail("file list contains duplicate paths")

    with tarfile.open(output_path, mode="w", format=tarfile.USTAR_FORMAT) as archive:
        for name in names:
            path = PurePosixPath(name)
            if path.is_absolute() or "." in path.parts or ".." in path.parts:
                fail(f"unsafe archive member: {name}")

            source = os.path.join(root, *path.parts)
            source_stat = os.lstat(source)
            if not stat.S_ISREG(source_stat.st_mode):
                fail(f"archive input is not a regular file: {name}")

            info = tarfile.TarInfo(name)
            info.size = source_stat.st_size
            info.mode = 0o755 if source_stat.st_mode & 0o111 else 0o644
            info.mtime = FIXED_MTIME
            info.uid = 0
            info.gid = 0
            info.uname = "root"
            info.gname = "root"
            with open(source, "rb") as payload:
                archive.addfile(info, payload)


if __name__ == "__main__":
    main()
