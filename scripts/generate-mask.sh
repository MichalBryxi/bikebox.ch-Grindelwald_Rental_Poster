#!/usr/bin/env bash
# Regenerates assets/images/hero-mountains-mask.png from
# assets/images/hero-bachalpsee.jpg by keying out the sky.
#
# Method: flood-fill from the top-center pixel (assumed sky) with a
# color-similarity tolerance (fuzz), clearing every contiguous pixel
# within that tolerance to transparent. Everything not connected to
# that seed point (the mountains, foreground, reflection) is left
# opaque. Fuzz too high eats into bright snow/glacier highlights
# (they read as close enough to sky); fuzz too low leaves unkeyed sky
# patches near the horizon where the color gradient shifts. 15% was
# the value actually verified by eye against both failure modes; it's
# since been lowered on request without re-checking — override with
# MASK_FUZZ if unkeyed sky patches show up near the horizon.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="assets/images/hero-bachalpsee.jpg"
OUT="assets/images/hero-mountains-mask.png"
FUZZ="${MASK_FUZZ:-8.4%}"

magick "$SRC" \
  -alpha set \
  -fuzz "$FUZZ" \
  -fill none \
  -draw "color %[fx:int(w/2)],5 floodfill" \
  -resize 1600x \
  "$OUT"

echo "Generated $OUT (fuzz=$FUZZ)"
