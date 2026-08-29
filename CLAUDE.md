# BikeBox Grindelwald — Rental Poster

An A4 print/PDF flyer for BikeBox Grindelwald's bike rental, built as a single
self-contained HTML file (no external requests — safe to open offline or print).

Local-only project. No Claude Artifact publishing.

## Structure

```
index.html            Source of truth (markup).
styles.css             Source of truth (CSS).
assets/fonts/*.woff2   8 font weights, self-hosted (see Fonts below).
assets/images/*        Hero photo, bike cutouts, logo mark, QR code.
vite.config.js         Inlines every asset as base64 → dist/index.html.
package.json           npm scripts: dev, build, preview.
dist/                  Build output. Gitignored — regenerated from
                        index.html + styles.css + assets/, never edited by
                        hand, never committed.
```

`index.html`, `styles.css`, and `assets/` all live at the project root, at
the same level — no `../` between them anywhere. That's deliberate: Vite's
dev server resolves an HTML/CSS relative URL like `../assets/x.png` against
the *served page's URL path* (which collapses `../` at the root and 404s),
not against the source file's real location on disk — even though the
production build resolves the same path correctly via real filesystem
resolution. Dev and build disagreeing on a path that escapes the root is
exactly the bug that bit us once; keeping everything sibling-level avoids the
mismatch entirely rather than working around it.

**Edit `index.html` / `styles.css`, never `dist/index.html` directly** — the
dist file is regenerated from scratch on every build and any hand edits to it
will be silently lost.

## Commands

```
npm install     # once, after cloning
npm run dev     # dev server with live reload — http://localhost:5173 (or next free port)
npm run build   # writes dist/index.html, self-contained
npm run preview # serves the built dist/ folder, to sanity-check the real build
```

`npm run dev` is the normal way to work: it live-reloads the browser on every
save to `index.html`, `styles.css`, or any file under `assets/`. Run
`npm run build` before printing or handing off `dist/index.html`, so it's
never stale relative to the source.

## Preview / print

- Dev: `npm run dev`, then open the printed `http://localhost:...` URL —
  reloads automatically on save.
- Final file: `npm run build`, then open `dist/index.html` directly in a
  browser (or `open dist/index.html`) — it's a single ~2 MB file, no server
  needed.
- To print: open `dist/index.html` in Chrome → Print. The page is sized to
  exact A4 (210×297mm) via the `@media print` block in `styles.css`, so it
  should print full-bleed on one sheet — set margins to "None" in the print
  dialog.

## Content (edit directly in `index.html`)

- **Pricing** — two `<table>`s: the main Bike/E-Bike × Hardtail/Fully matrix,
  and a second, separate table for Road/Gravel, and Helmet
  rental. Plain rows — edit the numbers directly.
- **Hours, address, phone, email** — in `<div class="footer">`.
- **QR code target** — currently points to
  `https://erp.app-room.ch/cycle_public/rental/en/b0adf4da3dc3be192aedb39793b9981d/time`
  (BikeBox's online booking page). To change the URL, regenerate the QR (see
  below) — the SVG doesn't encode the URL as text, it has to be re-rendered.

## Regenerating the QR code

```
pip install segno
python3 -c "
import segno
qr = segno.make('YOUR_URL_HERE', error='m')
qr.save('assets/images/qr-code.svg', scale=10, border=1, dark='#1b1f1d', light='#ffffff')
"
```
After saving, the file needs `width="390" height="390"` replaced with
`viewBox="0 0 390 390"` on the root `<svg>` tag — without a viewBox the code
gets clipped instead of scaled when CSS resizes it (this bit us once; the
`qr-code.svg` currently in `assets/images/` already has the fix applied).

## Fonts

Self-hosted, no CDN calls (keeps the file fully offline-safe):

| Font | Weight | Used for |
|---|---|---|
| Oswald | 500, 700 | Headline ("BIKE RENTAL"), section labels |
| IBM Plex Sans | 400, 500, 600 | Body copy |
| IBM Plex Mono | 500, 600 | Prices, table headers, footer data (tabular figures) |
| Baloo 2 | 700 | The "bikebox" wordmark |

**Baloo 2 was chosen by visual matching**, not from BikeBox's own CSS — their
real logo (`assets/images/logo-bikebox-mark.svg` is only the hexagon icon;
the full lowercase "bikebox" wordmark is a *rasterized* PNG baked into an SVG
on their site, not real text) so there's no font name to read off it. I
compared candidate rounded-geometric Google Fonts against their logo bitmap
and Baloo 2 Bold was the closest match. If you get their actual brand font
file at some point, swap it in — it'll look more correct than this
approximation.

## Asset sourcing

- **Logo mark** (`logo-bikebox-mark.svg`) — BikeBox's real icon, pulled from
  `bikebox.ch/wp-content/uploads/2023/04/logo-2.svg`.
- **Hero photo** (`hero-bachalpsee.jpg`) — Bachalpsee, the lake above
  Grindelwald that the flyer's copy references directly (it's the trail next
  to the First cable car, where the shop is). Sourced from Wikimedia Commons,
  public domain (`Bachalpsee_summer.jpg` by Johnw). No attribution legally
  required, but worth keeping in mind if you ever swap it.
- **Bike cutouts** (`bike-ghost-e-teru.png`, `bike-moustache-game5.png`) —
  both are **genuine transparent PNGs straight from the manufacturers**, not
  background-removed by us. (An earlier version of this file used ImageMagick
  flood-fill to key out a white studio backdrop from BikeBox's own JPGs —
  that approach reliably ate into any light-colored paint on the frame,
  since a pale frame and a white backdrop are often indistinguishable in a
  flat product photo. Don't reintroduce that technique; find the real
  transparent source instead, as below.)
  - `bike-ghost-e-teru.png`: turns out BikeBox's own upload
    (`bikebox.ch/product/ghost-e-teru-advanced/`) was *already* a proper
    alpha-channel cutout from Ghost's supplier feed — pulled directly, no
    processing.
  - `bike-moustache-game5.png`: BikeBox only had flat JPGs for this model, but
    Moustache's own site serves real cutout PNGs via their media CDN — pulled
    from a current Game-series product page
    (`moustachebikes.com/en-UK/electric-bikes/samedi-29-game/game-150-5`).
    Note the colorway is Moustache's current purple/orange hero shot, not the
    white/black 2023 "Game 5" BikeBox actually stocks — same product family,
    different paint job. Swap if an exact-match cutout turns up.
  - **Caveat:** the exact SKU "Ghost E-Teru **Universal**" doesn't appear in
    BikeBox's current catalog search — their E-Teru line lists Advanced,
    Advanced EQ, and Pro EQ ABS trims. `bike-ghost-e-teru.png` is the
    **Advanced (High, 29")** variant, the closest real match. Swap the image
    if a closer/newer trim shows up in their shop.
    original bike before the E-Teru swap) — safe to delete.
- **QR code** — generated locally with the `segno` Python library, not
  fetched from any API.

## Design notes

- Palette, type scale, and the "trailhead signpost" concept (the pricing
  icons riff on Swiss hiking-signpost pictograms) were an original design
  pass — see the CSS custom properties at the top of `styles.css`
  (`--paper`, `--ink`, `--signal`, `--trail`, `--band-bg`, `--band-ink`) for
  the color system. `--band-bg`/`--band-ink` are **fixed** tones (not
  light/dark-theme-adaptive) used specifically for the header photo band, the
  table header rows, and the footer — those are meant to stay dark regardless
  of the viewer's system theme, unlike the rest of the page which inverts
  normally in dark mode.
- The page is sized with CSS container query units (`cqi`) throughout, scaled
  off the sheet's own width rather than the viewport, so it holds its
  proportions whether it's shown shrunk down in a browser window or printed
  at full A4 size. If you add content and it starts overflowing the page
  (the sheet clips silently via `overflow:hidden` in `.sheet` rather than
  growing), check actual rendered height by temporarily removing
  `aspect-ratio` and `overflow:hidden` from `.sheet` and re-measuring, rather
  than eyeballing it.

## Known cleanup

`src/` (containing an old `flyer.template.html`, and now-orphaned copies of
`index.html`/`styles.css` from before the path-escaping fix above) is dead —
everything now lives at the project root instead. Safe to delete the whole
`src/` directory.
