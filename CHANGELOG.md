# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Multi-format export: a format picker (A0 poster / DL stand flyer) and an
  "Export as PNG…" button, rendering the sheet at true physical size for
  download. Sizing throughout the layout is driven by `--fmt-w`/`--fmt-h`/
  `--fmt-scale` custom properties so type and spacing scale correctly for
  whichever format is selected.

### Changed

- The DL stand-flyer format no longer leaves a large empty gap between the
  pricing table and the footer — the header photo now grows to absorb any
  left-over vertical space instead of it collapsing into one gap.
- Footnote text below the pricing tables is larger and easier to read.

### Fixed

- Several elements rendered correctly on screen but wrong (or missing) in
  the PNG export, all traced to the same root cause: `html-to-image`
  doesn't reliably carry certain CSS-driven styling through into the
  image it produces.
  - Bike-icon pictograms (hardtail/fully rows) — now styled with explicit
    SVG presentation attributes instead of CSS classes.
  - BikeBox logo — outline shape now has an explicit fill instead of a
    CSS class-driven one.
  - Header photo — replaced a CSS `background-image` (a fragile,
    silently-failing embed path in that library) with a plain `<img>`.
  - "BIKE RENTAL" headline outline and drop shadow — replaced
    `-webkit-text-stroke`/`text-shadow` (rendered correctly on screen, but
    incorrectly once Chromium rasterizes the SVG in "image mode" for
    export) with stacked, offset, solid-color duplicate layers.
- The export itself used to produce a blank image: the sheet was hidden
  during export via `position:fixed; left:-99999px`, which `html-to-image`
  clones verbatim — inside the SVG it renders into, `position:fixed` is
  relative to that SVG's own box, so the clone rendered itself off its own
  canvas. Replaced with an opaque overlay that covers the resize instead.
