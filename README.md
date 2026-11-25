# 🎃 Jack-o'-Lantern Studio

A haunted pumpkin-carving toy for the **Kiroween 2026 hackathon** — Costume Contest category.

Carve a face, light a candle, and download your creation.

**Live demo:** https://kiroween-jack-o-lantern.web.app

**Repository:** https://github.com/LuYquan/kiroween-jack-o-lantern-studio (public; created for the submission)

---

## What it is

Jack-o'-Lantern Studio runs entirely in the browser. A pumpkin fills the canvas; you pick a tool and carve it. Carved openings glow with a flickering candle inside. Flip to Night mode and the room goes dark — only the candlelight remains.

No sign-up. No install. No internet required after the first load.

---

## Features

| Feature | Description |
|---|---|
| **9 stamp shapes** | Triangle Eyes, Round Eyes, Crooked Eyes, Nose, Classic Grin, Toothy Grin, Frown, Star, Crescent Moon |
| **Freehand carve** | Drag to cut any shape you like |
| **Erase** | Click carvings to restore pumpkin flesh |
| **Candle glow + flicker** | Animated radial gradient bleeds through every carved hole |
| **Day / Night toggle** | Night mode darkens the room so the glow dominates |
| **4 preset faces** | Classic, Spooky, Silly, Wicked — applied in one click |
| **Gallery strip** | Thumbnail previews of all four presets |
| **"Haunt me" random face** | Generates a new random face every click |
| **Glow colour picker** | Orange · Green · Purple · Blood Red |
| **Export PNG** | Downloads the current canvas as `jack-o-lantern.png` |
| **Responsive** | Works at 390 px mobile width up to 1440 px desktop |

---

## How to run locally

Any static file server works. The simplest:

```bash
cd /path/to/kiroween
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

Alternatively, open `index.html` directly with `file://` — no server required.

**No build step. No npm. No dependencies.**

---

## File structure

```
index.html    — page shell and DOM structure
styles.css    — layout, theming, responsive breakpoints
app.js        — all application logic (drawing, state, tools, animation)
```

The pumpkin is drawn entirely with Canvas 2D vector paths — no images, no SVGs, no external fonts.

---

## Built with Kiro

This project was specced and built with **[Kiro](https://kiro.dev)**.

- Specs: `.kiro/specs/jack-o-lantern-studio/`
  - `requirements.md` — 42 EARS-style requirements
  - `design.md` — architecture, rendering pipeline, state model
  - `tasks.md` — implementation task checklist
- Steering: `.kiro/steering/product.md` — product vision and hard constraints

---

## Technical notes

- **Canvas compositing** — the pumpkin body is drawn on an offscreen canvas; carvings are punched through with `globalCompositeOperation = 'destination-out'`; the glow gradient is drawn beneath so it bleeds through the holes.
- **Normalised coordinates** — all carving positions are stored as 0–1 fractions of canvas size, so they survive any viewport resize without distortion.
- **Flicker** — a `requestAnimationFrame` loop updates the glow radius and opacity with a sine wave plus random jitter at ~12 fps to mimic candlelight.

---

## License

MIT © 2026 LuYquan
