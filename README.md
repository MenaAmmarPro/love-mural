# Our Mural — Love for Mena

A canvas we fill in together — hearts, stars, sparks. Come back to the same wall
and keep adding, exactly where you left it. Part of the **Love for Mena**
collection.

**Live:** https://menaammarpro.github.io/love-mural/

## What it does

- Tap or drag on the canvas to leave **marks** (hearts, stars, dots, sparks)
- Pick a **colour** and **size**
- **Undo** the last mark, **clear** the whole wall, or **save as an image**
- The mural is remembered on the device and reopens as you left it
- No tracking, no network calls — everything stays local
- Installable PWA with offline support

## How it works

Marks are stored as normalised coordinates (0..1) in localStorage under
`mena-mural`, so the drawing keeps its shape on any screen size. The colour list
and shape list are the `data-color`/`data-shape` buttons in `index.html`.

## Files

- `index.html` — the page
- `css/theme.css` — shared love-theme (copied from `_love-theme/`)
- `css/app.css` — page-specific styles (canvas + controls)
- `js/theme-main.js`, `js/effects.js` — shared behaviour/effects
- `js/app.js` — mural drawing logic
- `manifest.webmanifest`, `sw.js` — PWA
- `assets/` — favicon and icons

## Run locally

```powershell
py -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Static site, deployed with GitHub Pages from `main`.

## License

Creative Commons BY-NC-ND 4.0 — see [`LICENSE`](LICENSE).
© 2026 Ammar (MenaAmmarPro). Made with care for Mena.
