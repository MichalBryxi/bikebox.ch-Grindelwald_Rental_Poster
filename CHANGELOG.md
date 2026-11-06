# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- "Fully Premium" e-bike row (90.- / 125.-) at the top of the E-Bike group.
  Its bike icon is slightly longer with a slacker fork and a horizontal shock
  inside the frame and a star, all drawn as grey lines with a gold glow.

### Changed

- Bike rows are ordered from most to least suspension: Fully Premium, Fully,
  Hardtail for e-bikes; Fully, Hardtail for regular bikes.
- "Road / Gravel" is now just "Gravel" - road bikes are no longer rented.
- The Gravel and Helmet rows use line-drawn pictograms (a drop-bar gravel bike
  and a side-view helmet with vent slots and a Y strap) instead of emoji,
  matching the other bike icons. They have no red accent, since red marks
  suspension on the MTB icons.
- The notes under the table use bullets instead of dashes, and no em-dashes.
- The "Half day" column is now labelled "4 hours", and its footnote is gone;
  the full-day footnote moved up to a single asterisk.
- The bike-name column is a little wider so "Fully Premium" fits.
- Prices in the table are a little bigger.
- The footer QR column now stretches to the height of the address column
  and spreads its items over it; the QR code fills the space left over
  (never smaller than 18mm printed). Same layout for every format.
- The footer address column is split into three groups (logo, address,
  opening hours) spread over the footer height, matching the QR column.

### Fixed

- The Stand flyer header photo now reaches the right edge instead of leaving
  an empty strip down that side.
- On A1 and the Big poster the footer no longer runs off the bottom of the
  sheet (the email address was cut off).

## [v0.1.0]

### Added

- Multi-format export: a format picker (A0 poster / DL stand flyer) and an
  "Export as PNG…" button, rendering the sheet at true physical size for
  download. Sizing throughout the layout is driven by `--fmt-w`/`--fmt-h`/
  `--fmt-scale` custom properties so type and spacing scale correctly for
  whichever format is selected.
- A `[data-format]` attribute (set on `<html>` by `applyFormat()`) plus a
  dedicated "per-format overrides" section in `styles.css` for styling that
  should only apply to one physical format — hero-photo cropping today,
  a clear place for future formats' own hand-tuned deviations.

### Changed

- The DL stand-flyer format no longer leaves a large empty gap between the
  pricing table and the footer — the header photo now grows to absorb any
  left-over vertical space instead of it collapsing into one gap.
- Footnote text below the pricing tables is larger and easier to read.
- The "BIKE RENTAL" headline no longer has a black outline — plain white
  text with a drop shadow.
- A0's headline sits closer to the mountain peaks: shifted up by half its
  own height, with the header photo's crop tightened to match (more
  foreground below, peaks near the top instead of floating in empty sky)
  and the header itself a little shorter. DL's photo is nudged left so the
  riders sit better within the narrower frame.

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
  - "BIKE RENTAL" headline drop shadow — replaced `text-shadow` (renders
    correctly on screen, but gets dropped once Chromium rasterizes the SVG
    in "image mode" for export) with a stacked, offset, solid-color
    duplicate layer.
- The export itself used to produce a blank image: the sheet was hidden
  during export via `position:fixed; left:-99999px`, which `html-to-image`
  clones verbatim — inside the SVG it renders into, `position:fixed` is
  relative to that SVG's own box, so the clone rendered itself off its own
  canvas. Replaced with an opaque overlay that covers the resize instead.
- Type and spacing in the on-screen preview didn't scale together with the
  sheet as it shrank to fit the window, so proportions only matched the
  real output right at export/print time. A `ResizeObserver` now keeps
  `--fmt-scale` synced to the sheet's actual rendered size at all times.
