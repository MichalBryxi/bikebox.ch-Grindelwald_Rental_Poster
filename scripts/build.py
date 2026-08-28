#!/usr/bin/env python3
"""
Builds dist/flyer.html from src/flyer.template.html by inlining every local
asset (fonts, images, the QR code) as a base64 data: URI. The result is a
single self-contained HTML file — no external requests — suitable for
publishing as a Claude Artifact or opening directly in a browser / printing.

Usage:
    python3 scripts/build.py
"""

import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "src" / "flyer.template.html"
OUTPUT = ROOT / "dist" / "flyer.html"

MIME_TYPES = {
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
}

# Matches url('../assets/...') in CSS and src="../assets/..." in HTML tags.
ASSET_PATTERN = re.compile(r"""(url\(['"]|src=['"])(\.\./assets/[^'")]+)(['")])""")


def inline_assets(html: str) -> str:
    def replace(match: re.Match) -> str:
        prefix, rel_path, suffix = match.groups()
        asset_path = (TEMPLATE.parent / rel_path).resolve()
        mime = MIME_TYPES.get(asset_path.suffix.lower())
        if mime is None:
            raise ValueError(f"Unknown asset type: {asset_path}")
        data = base64.b64encode(asset_path.read_bytes()).decode()
        return f"{prefix}data:{mime};base64,{data}{suffix}"

    return ASSET_PATTERN.sub(replace, html)


def main() -> None:
    html = TEMPLATE.read_text()
    built = inline_assets(html)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(built)
    size_kb = len(built.encode()) / 1024
    print(f"Built {OUTPUT} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
