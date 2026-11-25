# Jack-o'-Lantern Studio — Implementation Tasks

Tasks are ordered for a clean build: each step compiles on what the previous steps established. Check off each item as it is completed.

---

## Phase 1 — Project Shell

- [x] **T-01** Create `index.html` with valid HTML5 boilerplate: `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, a `<link>` to `styles.css`, and a `<script src="app.js" defer>` at the end of `<body>`. *(REQ-41, REQ-42)*
- [x] **T-02** Create `styles.css` with CSS custom properties for colours (`--bg`, `--ui-bg`, `--accent`, `--glow`), a system font stack, and `box-sizing: border-box` reset. *(REQ-38)*
- [x] **T-03** Create `app.js` with a `DOMContentLoaded` listener as the single entry point and a `state` object initialised to default values. *(REQ-01)*

---

## Phase 2 — Pumpkin Rendering

- [x] **T-04** In `app.js`, implement `createOffscreenCanvas()` that returns a hidden canvas matching the main canvas dimensions. *(REQ-01)*
- [x] **T-05** Implement `drawPumpkin(ctx, w, h, nightMode)`: body ellipse, four rib ellipses, shading gradient, stem, and leaf — all expressed as fractions of `w`/`h`. *(REQ-01, REQ-03)*
- [x] **T-06** Implement `redraw()`: clears main canvas, draws background colour (day/night), calls `drawPumpkin` on the offscreen buffer, composites the buffer onto the main canvas. Call `redraw()` synchronously inside `DOMContentLoaded`. *(REQ-01, REQ-03, REQ-41)*
- [x] **T-07** Implement `handleResize()`: update `canvas.width`/`canvas.height` to match the container size, then call `redraw()`. Attach to `window.addEventListener('resize', ...)`. *(REQ-02, REQ-40)*
- [x] **T-08** Add the Canvas API fallback guard: if `!canvas.getContext`, hide the canvas and show a `<p id="fallback">` with the required message. *(REQ-42)*

---

## Phase 3 — Stamp Carving

- [x] **T-09** Implement `STAMP_SHAPES`: a map from shape ID to a factory function `(cx, cy, size) => Path2D` for all nine shapes: `triangle-eyes`, `round-eyes`, `crooked-eyes`, `nose`, `classic-grin`, `toothy-grin`, `frown`, `star`, `crescent-moon`. *(REQ-04)*
- [x] **T-10** Implement `applyStamp(shape, nx, ny)`: look up the `Path2D` factory, scale `nx`/`ny` to canvas pixels, draw with `globalCompositeOperation = 'destination-out'` on the offscreen buffer, then push a `{type:'stamp', shape, x:nx, y:ny, scale:1}` entry onto `state.carvings` and call `redraw()`. *(REQ-05, REQ-06)*
- [x] **T-11** Implement `replayCarvings(ctx, w, h)`: iterate `state.carvings` and redraw each stamp or freehand path using `destination-out`. Call this inside `redraw()` after `drawPumpkin`. *(REQ-06)*
- [x] **T-12** Add the tool palette to `index.html`: a `<nav id="tools">` with a button per stamp shape (label = human-readable name). Wire each button's click to set `state.activeTool = 'stamp:<shape>'` and highlight the active button. *(REQ-04)*
- [x] **T-13** Add a `click` listener on the main canvas: if `state.activeTool` starts with `'stamp:'`, call `applyStamp` with the normalised click coordinates and call `updateHint()`. *(REQ-05)*

---

## Phase 4 — Freehand Carve Tool

- [x] **T-14** Add a Freehand Carve button to the tool palette; clicking it sets `state.activeTool = 'freehand'`. *(REQ-07)*
- [x] **T-15** Implement pointer event handlers on the main canvas for freehand mode: `pointerdown` starts a new `{type:'freehand', points:[]}` entry in `state.carvings`; `pointermove` (while down) appends normalised points and calls `redraw()`; `pointerup` closes the stroke and calls `updateHint()`. *(REQ-08, REQ-09)*

---

## Phase 5 — Erase Tool

- [x] **T-16** Add an Erase button to the tool palette; clicking it sets `state.activeTool = 'erase'`. *(REQ-10)*
- [x] **T-17** Implement `eraseAt(nx, ny)`: compute `eraserRadius` in normalised units; filter `state.carvings` to remove stamps whose centre is within radius and freehand strokes that have any point within radius; call `redraw()` and `updateHint()`. *(REQ-11, REQ-12)*
- [x] **T-18** Wire the canvas `click` and `pointermove` (while down) handlers to call `eraseAt` when `state.activeTool === 'erase'`. *(REQ-11)*

---

## Phase 6 — Candle Glow and Flicker

- [x] **T-19** Implement `drawGlow(ctx, w, h, glowColour, flickerValue)`: create a `RadialGradient` centered on the pumpkin midpoint; use `flickerValue` to vary the outer radius and peak opacity; draw the gradient as the first layer on the main canvas (before the pumpkin buffer). *(REQ-13, REQ-14)*
- [x] **T-20** Implement `animateFlicker()`: run via `requestAnimationFrame`; every other frame (~12 fps), update a `flickerValue` using `0.85 + 0.15 * Math.sin(Date.now() / 80)` with a small random jitter; call `redraw()`. *(REQ-15, REQ-16)*
- [x] **T-21** Call `animateFlicker()` once at startup to begin the loop. Confirm that with no carvings the glow is invisible on the page (pumpkin is opaque). *(REQ-16)*

---

## Phase 7 — Day / Night Toggle

- [x] **T-22** Add a Day/Night toggle button to `index.html` (a `<button id="night-toggle">`). *(REQ-17)*
- [x] **T-23** Implement `toggleNight()`: flip `state.nightMode`, toggle the `night` class on `<body>`, and call `redraw()`. *(REQ-17, REQ-18, REQ-19, REQ-20)*
- [x] **T-24** In `styles.css`, define `body.night` overrides for `--bg` (near-black) and `--ui-bg`. *(REQ-18, REQ-19)*
- [x] **T-25** In `drawPumpkin`, read `nightMode` and reduce the ambient highlight gradient opacity when night, so the pumpkin looks dark and the glow is the main light source. *(REQ-18)*

---

## Phase 8 — Presets

- [x] **T-26** Define `PRESETS` in `app.js`: a plain object with keys `classic`, `spooky`, `silly`, `wicked`, each holding an array of `{shape, x, y, scale}` entries in normalised coordinates. *(REQ-21, REQ-22)*
- [x] **T-27** Implement `applyPreset(name)`: deep-copy `PRESETS[name]` into `state.carvings`, call `redraw()` and `updateHint()`. *(REQ-23)*
- [x] **T-28** Add four preset buttons to `index.html` (in a `<div id="presets">` section) wired to `applyPreset`. *(REQ-21, REQ-23)*

---

## Phase 9 — Gallery Strip

- [x] **T-29** Add `<div id="gallery">` to `index.html` containing four `<canvas class="thumb">` elements, one per preset. *(REQ-33)*
- [x] **T-30** Implement `initGallery()`: for each thumbnail canvas, call `drawPumpkin` then `replayCarvings` using the corresponding preset's carvings, at thumbnail dimensions (~100 × 100 px). *(REQ-34)*
- [x] **T-31** Add a `click` listener to each thumbnail that calls `applyPreset` with the matching preset name. *(REQ-35)*
- [x] **T-32** Call `initGallery()` once after `DOMContentLoaded`. *(REQ-33)*

---

## Phase 10 — Random Face ("Haunt me")

- [x] **T-33** Define face-region zone tables in `app.js`: arrays of candidate `{shape, x, y, scale}` entries grouped by region (left eye, right eye, nose, mouth, accent). *(REQ-25)*
- [x] **T-34** Implement `hauntMe()`: randomly select one candidate from each zone, assemble into a `carvings` array, compare to `state.lastRandom` hash to avoid repeats, update `state.carvings`, call `redraw()` and `updateHint()`. *(REQ-25, REQ-26)*
- [x] **T-35** Add a "Haunt me" button to `index.html` wired to `hauntMe()`. *(REQ-24)*

---

## Phase 11 — Glow Colour Picker

- [x] **T-36** Add a `<div id="glow-picker">` to `index.html` with four colour swatch buttons: Orange (`#FF6B00`), Green (`#00FF44`), Purple (`#BB00FF`), Blood Red (`#CC0022`). *(REQ-27)*
- [x] **T-37** Implement `setGlowColour(colour)`: update `state.glowColour`, mark the active swatch, call `redraw()`. *(REQ-28, REQ-29)*

---

## Phase 12 — PNG Export

- [x] **T-38** Add an "Export PNG" button to `index.html`. *(REQ-30)*
- [x] **T-39** Implement `exportPNG()`: call `canvas.toDataURL('image/png')`, create a temporary `<a>` element with `download="jack-o-lantern.png"`, programmatically click it, then remove it. *(REQ-31, REQ-32)*

---

## Phase 13 — Empty State Hint

- [x] **T-40** Add `<p id="hint">Click a tool, then click the pumpkin to carve</p>` to `index.html`, positioned below the canvas. *(REQ-36)*
- [x] **T-41** Implement `updateHint()`: set `hint.hidden = state.carvings.length > 0`. Call after every carving add or remove operation. *(REQ-36, REQ-37)*

---

## Phase 14 — Responsive Layout and Polish

- [x] **T-42** In `styles.css`, lay out the page in a two-column grid (canvas left, controls right) for viewports ≥ 600 px. *(REQ-38)*
- [x] **T-43** Add a `@media (max-width: 599px)` block that switches to a single-column flex column: canvas on top, all controls stacked below. *(REQ-39)*
- [x] **T-44** Ensure the main `<canvas>` has `max-width: 100%` and its container uses `aspect-ratio` or a padding trick to maintain proportions at any width. *(REQ-40)*
- [x] **T-45** Apply spooky-but-playful visual polish: dark wood or stone texture on the UI chrome via CSS gradients only (no images), orange accent colour on active tool button, subtle box-shadow on the canvas. *(Costume Contest)*

---

## Fixes after verification

- [x] **T-46** Add `#fallback[hidden] { display: none; }` to `styles.css` so the author `display: flex` rule on `#fallback` cannot override the `hidden` attribute on browsers that support canvas. The fallback appearance when genuinely shown (no-canvas browsers) is unchanged.
- [x] **T-47** Rework `drawPumpkin` in `app.js`: replace five filled rib ellipses with a single body ellipse using a sphere-like radial gradient plus five thin clipped rib arc strokes at low opacity. The pumpkin now reads as one round object instead of stacked discs. Update `design.md` to match.
- [x] **T-48** Increase preset stamp scales (1.6–1.7× for eyes/mouth, 0.9–1.1× for nose/nose-substitutes) and tighten all preset y-coordinates into the face zone (y: 0.41–0.65). Remove detached accent shapes (floating star/crescent at pumpkin edges) from all four presets. Faces are now bold and clearly grouped in both the main canvas and 90×90 gallery thumbnails.
- [x] **T-49** Fix hint not hiding immediately on freehand `pointerdown`: call `updateHint()` at the start of the freehand stroke (when the entry is pushed onto `state.carvings`) in addition to on `pointerup`. Hint now hides the moment any carving — stamp, freehand start, preset, or random face — appears.

---

## Manual Verification Checklist

Run these checks in a browser opened directly from the filesystem (`file://`) or a plain static server. No browser console errors should appear.

- [ ] **V-01** Open `index.html` with no prior interaction — confirm the pumpkin is visible immediately and the hint text "Click a tool, then click the pumpkin to carve" is shown.
- [ ] **V-02** Click each of the nine stamp tools in turn and click the pumpkin — confirm each shape is cut into the pumpkin and the candle glow bleeds through the holes.
- [ ] **V-03** Select the Freehand Carve tool and drag across the pumpkin — confirm a smooth cut follows the pointer and glow shows through.
- [ ] **V-04** Select the Erase tool and click an existing carving — confirm the carving is removed and the pumpkin flesh is restored.
- [ ] **V-05** Confirm the hint text disappears after the first carving and does not reappear unless all carvings are erased.
- [ ] **V-06** Click the Night toggle — confirm the background goes near-black, the pumpkin darkens, and the carved glow becomes the dominant light source.
- [ ] **V-07** Click the Night toggle again — confirm the page returns to the lit daytime state.
- [ ] **V-08** Click each of the four preset buttons (Classic, Spooky, Silly, Wicked) — confirm the pumpkin face changes to match the preset each time.
- [ ] **V-09** Click each of the four gallery thumbnails — confirm they apply the corresponding preset to the main canvas.
- [ ] **V-10** Click "Haunt me" three times — confirm a different random face appears each time.
- [ ] **V-11** Click each glow colour swatch — confirm the candlelight colour changes immediately in the carved openings.
- [ ] **V-12** Click "Export PNG" — confirm a file named `jack-o-lantern.png` is downloaded and contains the current canvas state (including night mode if active).
- [ ] **V-13** Resize the browser to 390 px wide — confirm the canvas fills the width, all controls are visible in a single-column layout, and no horizontal scrollbar appears.
- [ ] **V-14** Resize back to 1024 px — confirm the two-column layout is restored.
- [ ] **V-15** Carve a face, resize the window, and confirm all carvings are still present and correctly positioned after the resize.
