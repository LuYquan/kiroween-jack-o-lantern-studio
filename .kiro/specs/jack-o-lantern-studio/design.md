# Jack-o'-Lantern Studio — Design

## File List

```
index.html   — page shell, DOM structure, no inline scripts or styles
styles.css   — layout, palette, day/night theming, responsive breakpoints
app.js       — all application logic: drawing, state, tools, animation
```

No build step. No dependencies. Served as-is from any static host or opened directly with `file://`.

---

## Architecture Overview

### Rendering Model

The main canvas is the entire product surface. All visual output — pumpkin body, carvings, glow — is painted onto a single `<canvas>` element using the Canvas 2D API. The rendering pipeline runs in three ordered passes on every frame:

1. **Background pass** — clear the canvas; fill with the day or night background colour.
2. **Pumpkin pass** — draw the pumpkin body (ribbed segments, stem, leaf) using `Path2D` vector shapes onto an offscreen canvas. This offscreen buffer is composited onto the main canvas and also acts as the clip mask: carvings only appear where pumpkin flesh exists.
3. **Carving pass** — replay every recorded carving (stamps and freehand strokes) onto the offscreen pumpkin buffer using `globalCompositeOperation = 'destination-out'` to punch holes, then draw the buffer onto the main canvas.
4. **Glow pass** — draw a radial gradient (candle colour, animated radius/opacity) beneath the pumpkin layer so that it bleeds through the transparent carved pixels. Compositing order: glow is drawn first, pumpkin+carvings second, so light shows only where flesh has been removed.

Because the pumpkin is redrawn from vector paths every frame, resizing the viewport just changes the canvas dimensions and triggers a full redraw with no loss of carving data.

### Coordinate System

All stamp positions and freehand points are stored as **normalised coordinates** (values 0–1 relative to canvas width/height). On redraw, they are multiplied by the current canvas dimensions. This makes the state resolution-independent.

### Offscreen Canvas

An `OffscreenCanvas` (or a hidden `<canvas>`) holds the pumpkin body with carvings punched out. The main canvas composites this buffer over the glow layer each frame. This separation keeps the glow-bleed effect correct without requiring per-pixel manipulation.

---

## State Model

```js
state = {
  carvings: [          // ordered list; replayed in order on each redraw
    {
      type: 'stamp',
      shape: String,   // e.g. 'triangle-eyes', 'classic-grin'
      x: Number,       // normalised 0–1
      y: Number,       // normalised 0–1
      scale: Number,   // 1.0 default
    },
    {
      type: 'freehand',
      points: [{x, y}] // normalised
    },
    // erase operations remove intersecting entries from this array
  ],
  activeTool: String,  // 'stamp:<shape>' | 'freehand' | 'erase'
  glowColour: String,  // 'orange' | 'green' | 'purple' | 'blood-red'
  nightMode: Boolean,
  hasCarving: Boolean, // derived: carvings.length > 0; drives empty-state hint
}
```

State lives entirely in memory. There is no localStorage or URL serialisation (out of scope).

---

## Pumpkin Drawing

The pumpkin body is drawn with Canvas 2D path commands:

- **Body** — a single large ellipse filled with a radial gradient: bright orange highlight at upper-left, deepening through mid-orange to dark brown at the outer edge. This gives an immediate sphere read without any disc artefacts.
- **Ribs** — five thin arc strokes (narrow ellipses drawn as `stroke`, not `fill`), clipped to the body ellipse so they never bleed outside the silhouette. Each rib is semi-transparent (0.28–0.32 alpha) so they suggest depth without creating hard dividing lines.
- **Highlight arc** — one broad, low-opacity bezier stroke along the upper-left shoulder reinforces the lit side of the sphere.
- **Rim shading** — a linear gradient overlay from transparent at the equator to dark at the bottom rim gives the bottom of the pumpkin weight.
- **Stem** — a rounded bezier curve at the top, filled dark green.
- **Leaf** — a small bezier leaf shape off the stem, filled medium green, with a vine-curl stroke.

All coordinates are expressed as fractions of canvas width/height so the pumpkin scales perfectly.

---

## Stamp Shapes

Each stamp is a `Path2D` factory function that accepts `(cx, cy, size)` and returns a path. Shapes:

| ID | Path Description |
|---|---|
| `triangle-eyes` | Two equilateral triangles, mirrored horizontally |
| `round-eyes` | Two circles |
| `crooked-eyes` | Two irregular quadrilaterals (one higher than the other) |
| `nose` | Small downward triangle |
| `classic-grin` | Arc with upward curve and small corner cuts |
| `toothy-grin` | Arc with rectangular notch cutouts along the bottom edge |
| `frown` | Arc with downward curve |
| `star` | Five-point star via sin/cos |
| `crescent-moon` | Two overlapping arcs, outer minus inner |

Stamps are applied with `ctx.globalCompositeOperation = 'destination-out'` on the offscreen pumpkin buffer, then the main canvas is refreshed.

---

## Freehand Carving

On `pointerdown` with the freehand tool active, a new stroke entry is added to `state.carvings`. On `pointermove` (while pointer is down), normalised coordinates are appended to the stroke's `points` array and the stroke is redrawn live. On `pointerup`, the stroke is closed. The freehand path is replayed as a filled `Path2D` with `destination-out`.

---

## Erase Tool

The eraser replays carvings from `state.carvings` and removes any stamp whose centre falls within `eraserRadius` pixels of the pointer, and any freehand stroke that has at least one point within the radius. After removal, the canvas is fully redrawn. This is state-level erasure — no per-pixel painting — which keeps the state consistent with the visual.

---

## Candle Glow and Flicker

A `requestAnimationFrame` loop runs continuously. Each tick:

1. Compute a flicker value: `flicker = 0.85 + 0.15 * Math.sin(Date.now() / 80 + noise)` where `noise` is a small random offset updated every ~80 ms.
2. Draw a `createRadialGradient` centered on the pumpkin midpoint with radius = `baseRadius * flicker` and opacity = `baseOpacity * flicker`.
3. Gradient stops: glow colour at 0% (full opacity), glow colour at 40% (60% opacity), transparent at 100%.
4. The glow layer is drawn first on the main canvas; the pumpkin+carvings buffer is drawn on top with default compositing. Light bleeds through only where `destination-out` made the pumpkin buffer transparent.

Flicker runs at ~12 fps (every other animation frame) to look like candlelight rather than a smooth pulse.

---

## Day / Night Mode

A CSS class `night` on `<body>` drives background and UI chrome colours via custom properties:

```css
:root {
  --bg: #f5e6c8;
  --ui-bg: #2a1a0a;
}
body.night {
  --bg: #0a0a0f;
  --ui-bg: #1a0a1a;
}
```

In night mode, `app.js` also reduces the ambient fill on the pumpkin body (darkens the pumpkin's own gradient) so the candle glow is the dominant light. The state flag `nightMode` is checked at the start of each draw pass.

---

## Presets

Each preset is a plain JS object: an array of `{shape, x, y, scale}` entries using normalised coordinates. Example:

```js
PRESETS.classic = [
  { shape: 'triangle-eyes', x: 0.5, y: 0.42, scale: 1 },
  { shape: 'classic-grin',  x: 0.5, y: 0.62, scale: 1 },
];
```

Applying a preset replaces `state.carvings` with a deep copy of the preset array and calls `redraw()`.

---

## Gallery Strip

Four `<canvas>` thumbnail elements (one per preset) are rendered at ~100 × 100 px. Each is drawn once on page load using the same `drawPumpkin` / `applyCarving` functions as the main canvas. Clicking a thumbnail calls `applyPreset(name)`.

---

## Random Face ("Haunt me")

A pool of stamp placements is defined for each face region (left-eye zone, right-eye zone, nose zone, mouth zone, accent zone). "Haunt me" picks randomly from each zone pool and assembles a `carvings` array. A `lastRandom` hash prevents exact repeats.

---

## PNG Export

```js
function exportPNG() {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jack-o-lantern.png';
  a.click();
}
```

The canvas state at the moment of export (including night mode and glow colour) is captured as-is.

---

## Requirement-to-Code Map

| Requirement(s) | Code location |
|---|---|
| REQ-01, REQ-03, REQ-41 | `drawPumpkin()` called synchronously in `DOMContentLoaded` handler |
| REQ-02, REQ-40 | `window.addEventListener('resize', handleResize)` → `redraw()` |
| REQ-04, REQ-05, REQ-06 | `STAMP_SHAPES` map + `applyStamp()` + stamp entry in `state.carvings` |
| REQ-07, REQ-08, REQ-09 | Freehand tool pointer event handlers + freehand entry in `state.carvings` |
| REQ-10, REQ-11, REQ-12 | `eraseAt(x, y)` filters `state.carvings` and calls `redraw()` |
| REQ-13, REQ-14 | `drawGlow()` with radial gradient composited under pumpkin buffer |
| REQ-15, REQ-16 | `requestAnimationFrame` flicker loop in `animateFlicker()` |
| REQ-17, REQ-18, REQ-19, REQ-20 | Night toggle button → `toggleNight()` → `body.classList.toggle('night')` + `redraw()` |
| REQ-21, REQ-22, REQ-23 | `PRESETS` object + `applyPreset(name)` |
| REQ-24, REQ-25, REQ-26 | `hauntMe()` random face generator |
| REQ-27, REQ-28, REQ-29 | Colour picker buttons → `setGlowColour(colour)` → `redraw()` |
| REQ-30, REQ-31, REQ-32 | `exportPNG()` using `canvas.toDataURL` |
| REQ-33, REQ-34, REQ-35 | Gallery `<canvas>` elements drawn in `initGallery()` + click handlers |
| REQ-36, REQ-37 | `updateHint()` checks `state.carvings.length` and toggles hint element visibility |
| REQ-38, REQ-39 | `styles.css` media query at 600 px breakpoint |
| REQ-42 | `if (!canvas.getContext) { showFallback() }` guard in `DOMContentLoaded` |
