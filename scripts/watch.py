#!/usr/bin/env python3
"""
Watches src/ and assets/ for changes and re-runs build.py automatically.
No external dependencies — plain mtime polling.

Usage:
    python3 scripts/watch.py
"""

import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WATCH_DIRS = [ROOT / "src", ROOT / "assets"]
BUILD_SCRIPT = ROOT / "scripts" / "build.py"
POLL_SECONDS = 1.0


def snapshot() -> dict:
    state = {}
    for d in WATCH_DIRS:
        for path in d.rglob("*"):
            if path.is_file():
                state[path] = path.stat().st_mtime
    return state


def build() -> None:
    result = subprocess.run(["python3", str(BUILD_SCRIPT)], capture_output=True, text=True)
    ts = time.strftime("%H:%M:%S")
    if result.returncode == 0:
        print(f"[{ts}] {result.stdout.strip()}")
    else:
        print(f"[{ts}] build failed:\n{result.stderr}")


def main() -> None:
    print(f"Watching {', '.join(str(d.relative_to(ROOT)) for d in WATCH_DIRS)} for changes...")
    build()
    last = snapshot()
    while True:
        time.sleep(POLL_SECONDS)
        current = snapshot()
        if current != last:
            build()
            last = current


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
