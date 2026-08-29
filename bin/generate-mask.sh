#!/usr/bin/env bash
# Regenerates src/assets/generated/hero-mountains-mask.png from
# src/assets/images/hero-02.jpg by keying out the sky.
#
# Output lives under src/assets/generated/ (gitignored), not
# src/assets/images/ (committed sources) — it's a deterministic derivative
# of hero-02.jpg, not an asset anyone hand-authored, so it doesn't belong
# in git any more than dist/ does. Regenerated automatically by predev/prebuild.
#
# Lives under src/assets/generated/ rather than dist/: the dev server
# serves src/ as its root (nothing outside it is reachable via relative
# url()s), and `vite build` empties dist/ at the start of every build,
# before this script's output would ever get inlined. Sitting under src/
# keeps it visible to both dev and build while still being clearly
# separate from hand-sourced assets and gitignored like a build artifact.
#
# Method: flood-fill from the top-center pixel (assumed sky) with a
# color-similarity tolerance (fuzz), clearing every contiguous pixel
# within that tolerance to transparent. Everything not connected to
# that seed point (the mountains, foreground, reflection) is left
# opaque. Fuzz too high eats into bright snow/glacier highlights
# (they read as close enough to sky); fuzz too low leaves unkeyed sky
# patches near the horizon where the color gradient shifts.
#
# NOTE: the 8.4% default below was tuned by eye against the *previous*
# source photo (hero-bachalpsee.jpg). It has not been re-verified
# against hero-02.jpg — a different photo's sky/snow contrast can need
# a different value entirely. Check the output for eaten snow (fuzz
# too high) or unkeyed sky patches near the horizon (fuzz too low),
# and override with MASK_FUZZ as needed.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="src/assets/images/hero-02.jpg"
OUT="src/assets/generated/hero-mountains-mask.png"
FUZZ="${MASK_FUZZ:-8.4%}"

magick "$SRC" \
  -alpha set \
  -fuzz "$FUZZ" \
  -fill none \
  -draw "color %[fx:int(w/2)],5 floodfill" \
  -resize 1600x \
  "$OUT"

echo "Generated $OUT (fuzz=$FUZZ)"
