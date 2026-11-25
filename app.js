/**
 * Jack-o'-Lantern Studio — app.js
 * Static · no dependencies · Canvas 2D only
 */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  carvings:    [],          // {type:'stamp'|'freehand', ...}
  activeTool:  null,        // 'stamp:<shape>' | 'freehand' | 'erase'
  glowColour:  'orange',
  nightMode:   false,
  lastRandom:  null,        // hash string to detect consecutive duplicate randoms
  flickerVal:  1,
  flickerNoise: 0,
  frameCount:  0,
  pointerDown: false,
  activeStrokeIndex: -1,    // index into state.carvings for the in-progress freehand stroke
};

// ─── Glow colour map ──────────────────────────────────────────────────────────

const GLOW_COLOURS = {
  'orange':    '#FF6B00',
  'green':     '#00FF44',
  'purple':    '#BB00FF',
  'blood-red': '#CC0022',
};

// ─── Stamp shape factories ────────────────────────────────────────────────────
// Each function accepts (cx, cy, size) in pixel coords and returns a Path2D.

const STAMP_SHAPES = {

  'triangle-eyes': (cx, cy, size) => {
    const p = new Path2D();
    const s = size * 0.38;
    const gap = size * 0.3;
    // Left eye
    p.moveTo(cx - gap - s, cy + s * 0.8);
    p.lineTo(cx - gap,     cy - s * 0.8);
    p.lineTo(cx - gap + s, cy + s * 0.8);
    p.closePath();
    // Right eye
    p.moveTo(cx + gap - s, cy + s * 0.8);
    p.lineTo(cx + gap,     cy - s * 0.8);
    p.lineTo(cx + gap + s, cy + s * 0.8);
    p.closePath();
    return p;
  },

  'round-eyes': (cx, cy, size) => {
    const p = new Path2D();
    const r = size * 0.28;
    const gap = size * 0.32;
    p.arc(cx - gap, cy, r, 0, Math.PI * 2);
    p.moveTo(cx + gap + r, cy);
    p.arc(cx + gap, cy, r, 0, Math.PI * 2);
    return p;
  },

  'crooked-eyes': (cx, cy, size) => {
    const p = new Path2D();
    const s = size * 0.3;
    const gap = size * 0.28;
    // Left eye — tilted diamond
    p.moveTo(cx - gap,         cy - s);
    p.lineTo(cx - gap + s * 0.7, cy);
    p.lineTo(cx - gap,         cy + s * 0.5);
    p.lineTo(cx - gap - s * 0.6, cy + s * 0.1);
    p.closePath();
    // Right eye — higher, different tilt
    const oy = -size * 0.15;
    p.moveTo(cx + gap - s * 0.3, cy + oy - s * 0.8);
    p.lineTo(cx + gap + s * 0.6, cy + oy - s * 0.1);
    p.lineTo(cx + gap + s * 0.2, cy + oy + s * 0.5);
    p.lineTo(cx + gap - s * 0.5, cy + oy);
    p.closePath();
    return p;
  },

  'nose': (cx, cy, size) => {
    const p = new Path2D();
    const s = size * 0.28;
    p.moveTo(cx,          cy - s * 0.5);
    p.lineTo(cx + s,      cy + s * 0.8);
    p.lineTo(cx - s,      cy + s * 0.8);
    p.closePath();
    return p;
  },

  'classic-grin': (cx, cy, size) => {
    const p = new Path2D();
    const rx = size * 0.55;
    const ry = size * 0.28;
    const thick = size * 0.1;
    // Outer arc (smile)
    p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
    // Inner arc slightly smaller (creates thickness)
    p.ellipse(cx, cy, rx - thick, ry - thick * 0.5, 0, Math.PI, 0, true);
    p.closePath();
    return p;
  },

  'toothy-grin': (cx, cy, size) => {
    const p = new Path2D();
    const rx = size * 0.55;
    const ry = size * 0.3;
    const thick = size * 0.22;
    const toothW = rx * 0.22;
    const toothH = thick * 0.55;
    const numTeeth = 4;
    const startX = cx - rx * 0.72;
    const topY = cy;

    // Build mouth band: outer smile arc + inner straight path with tooth notches
    p.moveTo(cx - rx, cy);
    p.ellipse(cx, cy, rx, ry, 0, Math.PI, 0); // top of mouth (outer)
    // Right to left across the bottom, cutting out teeth gaps
    const steps = numTeeth + 1;
    const totalW = rx * 1.44;
    const stepW = totalW / steps;
    // Right side down
    p.lineTo(cx + rx, topY + thick);
    // Draw teeth: gaps are the carved sections (we fill the band and subtract notches)
    for (let i = steps - 1; i >= 0; i--) {
      const lx = startX + i * stepW;
      const rx2 = lx + stepW;
      // tooth top
      p.lineTo(rx2, topY + thick);
      p.lineTo(rx2, topY + thick - toothH);
      p.lineTo(lx + stepW - toothW, topY + thick - toothH);
      p.lineTo(lx + stepW - toothW, topY + thick);
    }
    p.closePath();
    return p;
  },

  'frown': (cx, cy, size) => {
    const p = new Path2D();
    const rx = size * 0.5;
    const ry = size * 0.25;
    const thick = size * 0.1;
    // Frown: arc opens upward → π to 2π (bottom)
    p.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    p.ellipse(cx, cy, rx - thick, ry - thick * 0.5, 0, 0, Math.PI, false);
    p.closePath();
    return p;
  },

  'star': (cx, cy, size) => {
    const p = new Path2D();
    const outerR = size * 0.5;
    const innerR = size * 0.22;
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
    }
    p.closePath();
    return p;
  },

  'crescent-moon': (cx, cy, size) => {
    const p = new Path2D();
    const r = size * 0.45;
    const offset = r * 0.42;
    // Outer circle
    p.arc(cx, cy, r, 0, Math.PI * 2);
    // Inner circle offset to the right, subtracted via even-odd fill
    p.arc(cx + offset, cy - offset * 0.3, r * 0.78, 0, Math.PI * 2);
    return p;
  },
};

// ─── Preset face definitions (normalised coords 0–1) ─────────────────────────

const PRESETS = {
  classic: [
    { type: 'stamp', shape: 'triangle-eyes', x: 0.50, y: 0.42, scale: 1.6 },
    { type: 'stamp', shape: 'nose',          x: 0.50, y: 0.54, scale: 1.1 },
    { type: 'stamp', shape: 'classic-grin',  x: 0.50, y: 0.65, scale: 1.6 },
  ],
  spooky: [
    { type: 'stamp', shape: 'crooked-eyes',  x: 0.50, y: 0.41, scale: 1.6 },
    { type: 'stamp', shape: 'nose',          x: 0.50, y: 0.54, scale: 1.0 },
    { type: 'stamp', shape: 'frown',         x: 0.50, y: 0.65, scale: 1.5 },
  ],
  silly: [
    { type: 'stamp', shape: 'round-eyes',    x: 0.50, y: 0.41, scale: 1.7 },
    { type: 'stamp', shape: 'star',          x: 0.50, y: 0.53, scale: 0.9 },
    { type: 'stamp', shape: 'toothy-grin',   x: 0.50, y: 0.65, scale: 1.6 },
  ],
  wicked: [
    { type: 'stamp', shape: 'crooked-eyes',  x: 0.50, y: 0.41, scale: 1.7 },
    { type: 'stamp', shape: 'crescent-moon', x: 0.50, y: 0.53, scale: 0.9 },
    { type: 'stamp', shape: 'toothy-grin',   x: 0.50, y: 0.65, scale: 1.65 },
  ],
};

// ─── Random-face zone tables (normalised) ─────────────────────────────────────

const ZONES = {
  leftEye: [
    { type: 'stamp', shape: 'triangle-eyes', x: 0.50, y: 0.39, scale: 1.0 },
    { type: 'stamp', shape: 'round-eyes',    x: 0.50, y: 0.39, scale: 1.0 },
    { type: 'stamp', shape: 'crooked-eyes',  x: 0.50, y: 0.39, scale: 1.0 },
    { type: 'stamp', shape: 'round-eyes',    x: 0.50, y: 0.42, scale: 1.1 },
    { type: 'stamp', shape: 'triangle-eyes', x: 0.50, y: 0.42, scale: 0.9 },
  ],
  nose: [
    null, // 50% chance of no nose
    null,
    { type: 'stamp', shape: 'nose',          x: 0.50, y: 0.53, scale: 0.8 },
    { type: 'stamp', shape: 'nose',          x: 0.52, y: 0.54, scale: 1.0 },
    { type: 'stamp', shape: 'crescent-moon', x: 0.50, y: 0.53, scale: 0.45 },
  ],
  mouth: [
    { type: 'stamp', shape: 'classic-grin',  x: 0.50, y: 0.66, scale: 1.0 },
    { type: 'stamp', shape: 'toothy-grin',   x: 0.50, y: 0.66, scale: 1.0 },
    { type: 'stamp', shape: 'frown',         x: 0.50, y: 0.66, scale: 0.95 },
    { type: 'stamp', shape: 'toothy-grin',   x: 0.50, y: 0.67, scale: 1.1 },
    { type: 'stamp', shape: 'classic-grin',  x: 0.50, y: 0.65, scale: 0.9 },
  ],
  accent: [
    null,  // no accent
    null,
    { type: 'stamp', shape: 'star',          x: 0.72, y: 0.32, scale: 0.5 },
    { type: 'stamp', shape: 'crescent-moon', x: 0.28, y: 0.33, scale: 0.5 },
    { type: 'stamp', shape: 'star',          x: 0.28, y: 0.72, scale: 0.45 },
    { type: 'stamp', shape: 'crescent-moon', x: 0.72, y: 0.70, scale: 0.48 },
    { type: 'stamp', shape: 'star',          x: 0.72, y: 0.32, scale: 0.45 },
  ],
};

// ─── DOM references (populated after DOMContentLoaded) ───────────────────────

let canvas, ctx, offscreen, offCtx;
let hintEl, nightToggleBtn, exportBtn, hauntBtn;

// ─── Pumpkin geometry helpers ─────────────────────────────────────────────────

/**
 * Returns the pumpkin bounding region for a canvas of size (w × h).
 * The pumpkin body is an ellipse; we return its centre and radii.
 */
function pumpkinGeometry(w, h) {
  return {
    cx:   w * 0.50,
    cy:   h * 0.52,
    rx:   w * 0.38,
    ry:   h * 0.37,
  };
}

// ─── Drawing functions ────────────────────────────────────────────────────────

/**
 * Draw the pumpkin body onto the given context at size (w × h).
 * nightMode dims the ambient highlight so the glow dominates.
 *
 * Rendering approach:
 *  1. Single body ellipse filled with a radial gradient (light upper-left →
 *     dark lower-right) so it reads as one round sphere.
 *  2. Five thin rib arcs drawn as low-opacity curved strokes — no filled
 *     ellipses, so there are no hard disc edges.
 *  3. A linear shading overlay darkens the bottom rim.
 *  4. Stem and leaf drawn on top.
 */
function drawPumpkin(targetCtx, w, h, nightMode) {
  const { cx, cy, rx, ry } = pumpkinGeometry(w, h);

  targetCtx.save();

  // ── 1. Body: single ellipse with sphere-like radial gradient ──────────────
  const bodyGrad = targetCtx.createRadialGradient(
    cx - rx * 0.25, cy - ry * 0.3, ry * 0.05,   // inner highlight (upper-left)
    cx,             cy,             Math.max(rx, ry) * 1.05  // outer edge
  );
  if (nightMode) {
    bodyGrad.addColorStop(0,   '#c04010');
    bodyGrad.addColorStop(0.45,'#8a2e08');
    bodyGrad.addColorStop(0.8, '#5a1800');
    bodyGrad.addColorStop(1,   '#2a0800');
  } else {
    bodyGrad.addColorStop(0,   '#ffa040');
    bodyGrad.addColorStop(0.35,'#e86018');
    bodyGrad.addColorStop(0.72,'#c04010');
    bodyGrad.addColorStop(1,   '#7a2200');
  }

  targetCtx.beginPath();
  targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  targetCtx.fillStyle = bodyGrad;
  targetCtx.fill();

  // ── 2. Rib arcs: thin curved strokes, clipped to the body ellipse ─────────
  // We clip so strokes never bleed outside the pumpkin silhouette.
  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  targetCtx.clip();

  // Five rib centre-lines at x offsets relative to cx.
  // Each rib is a narrow vertical ellipse drawn as a stroke only.
  const ribXOffsets = [-0.68, -0.34, 0, 0.34, 0.68];
  const ribAlphas   = [0.28,   0.32, 0.30, 0.32, 0.28]; // outer ribs slightly fainter
  const ribColour   = nightMode ? '80,20,0' : '60,15,0';

  ribXOffsets.forEach((off, i) => {
    const ribCx = cx + rx * off;
    const ribRx = rx * 0.30;   // narrow — just wide enough to curve visibly
    const ribRy = ry * 1.0;

    targetCtx.beginPath();
    targetCtx.ellipse(ribCx, cy, ribRx, ribRy, 0, 0, Math.PI * 2);
    targetCtx.strokeStyle = `rgba(${ribColour},${ribAlphas[i]})`;
    targetCtx.lineWidth   = Math.max(w * 0.009, 2);
    targetCtx.stroke();
  });

  // Subtle highlight arc along the upper-left shoulder
  targetCtx.beginPath();
  targetCtx.ellipse(cx - rx * 0.18, cy - ry * 0.05, rx * 0.55, ry * 0.65, -0.3, Math.PI * 1.1, Math.PI * 1.75);
  targetCtx.strokeStyle = nightMode ? 'rgba(200,80,20,0.18)' : 'rgba(255,200,120,0.28)';
  targetCtx.lineWidth   = Math.max(w * 0.025, 4);
  targetCtx.stroke();

  targetCtx.restore(); // end clip

  // ── 3. Bottom-rim shading overlay ─────────────────────────────────────────
  const rimGrad = targetCtx.createLinearGradient(cx, cy, cx, cy + ry);
  if (nightMode) {
    rimGrad.addColorStop(0,   'rgba(0,0,0,0)');
    rimGrad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    rimGrad.addColorStop(1,   'rgba(0,0,0,0.75)');
  } else {
    rimGrad.addColorStop(0,   'rgba(0,0,0,0)');
    rimGrad.addColorStop(0.6, 'rgba(0,0,0,0.18)');
    rimGrad.addColorStop(1,   'rgba(0,0,0,0.38)');
  }
  targetCtx.beginPath();
  targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  targetCtx.fillStyle = rimGrad;
  targetCtx.fill();

  // --- Stem ---
  const stemX    = cx - w * 0.025;
  const stemTopY = cy - ry - h * 0.07;
  const stemBotY = cy - ry + h * 0.015;
  const stemW    = w * 0.05;
  targetCtx.beginPath();
  targetCtx.moveTo(stemX, stemBotY);
  targetCtx.bezierCurveTo(
    stemX - stemW,      stemBotY - h * 0.03,
    stemX + stemW * 0.3, stemTopY + h * 0.02,
    stemX + stemW * 0.2, stemTopY
  );
  targetCtx.bezierCurveTo(
    stemX + stemW * 0.5, stemTopY + h * 0.01,
    stemX + stemW,       stemBotY - h * 0.02,
    stemX + stemW * 1.2, stemBotY
  );
  targetCtx.closePath();
  targetCtx.fillStyle = nightMode ? '#1a3a00' : '#2d6a00';
  targetCtx.fill();
  targetCtx.strokeStyle = nightMode ? '#0d2200' : '#1a4400';
  targetCtx.lineWidth = w * 0.004;
  targetCtx.stroke();

  // --- Leaf ---
  const leafX = stemX + stemW * 1.1;
  const leafY = stemTopY + h * 0.025;
  targetCtx.beginPath();
  targetCtx.moveTo(leafX, leafY);
  targetCtx.bezierCurveTo(
    leafX + w * 0.08,  leafY - h * 0.04,
    leafX + w * 0.11,  leafY + h * 0.03,
    leafX + w * 0.04,  leafY + h * 0.02
  );
  targetCtx.bezierCurveTo(
    leafX + w * 0.025, leafY + h * 0.025,
    leafX - w * 0.005, leafY + h * 0.01,
    leafX, leafY
  );
  targetCtx.fillStyle = nightMode ? '#1a4a00' : '#3a8a00';
  targetCtx.fill();

  // --- Vine curl off stem ---
  targetCtx.beginPath();
  targetCtx.moveTo(leafX + w * 0.01, leafY - h * 0.005);
  targetCtx.bezierCurveTo(
    leafX + w * 0.06,  leafY - h * 0.05,
    leafX + w * 0.10,  leafY - h * 0.01,
    leafX + w * 0.08,  leafY + h * 0.02
  );
  targetCtx.strokeStyle = nightMode ? '#1a4a00' : '#2d6a00';
  targetCtx.lineWidth = w * 0.007;
  targetCtx.stroke();

  targetCtx.restore();
}

/**
 * Draw a single carving entry onto targetCtx at size (w × h).
 * Uses destination-out so carved pixels become transparent.
 */
function drawCarving(targetCtx, carving, w, h) {
  const prevComp = targetCtx.globalCompositeOperation;
  targetCtx.globalCompositeOperation = 'destination-out';
  targetCtx.fillStyle   = 'rgba(0,0,0,1)';
  targetCtx.strokeStyle = 'rgba(0,0,0,1)';

  if (carving.type === 'stamp') {
    const factory = STAMP_SHAPES[carving.shape];
    if (!factory) return;
    const px   = carving.x * w;
    const py   = carving.y * h;
    const size = Math.min(w, h) * 0.12 * carving.scale;
    const path = factory(px, py, size);
    // crescent-moon uses even-odd fill rule for the cutout shape
    if (carving.shape === 'crescent-moon') {
      targetCtx.fill(path, 'evenodd');
    } else {
      targetCtx.fill(path);
    }
  } else if (carving.type === 'freehand') {
    const pts = carving.points;
    if (pts.length < 2) {
      // Single point — draw a small circle
      if (pts.length === 1) {
        targetCtx.beginPath();
        targetCtx.arc(pts[0].x * w, pts[0].y * h, Math.min(w, h) * 0.018, 0, Math.PI * 2);
        targetCtx.fill();
      }
      targetCtx.globalCompositeOperation = prevComp;
      return;
    }
    targetCtx.lineWidth   = Math.min(w, h) * 0.035;
    targetCtx.lineCap     = 'round';
    targetCtx.lineJoin    = 'round';
    targetCtx.beginPath();
    targetCtx.moveTo(pts[0].x * w, pts[0].y * h);
    for (let i = 1; i < pts.length; i++) {
      targetCtx.lineTo(pts[i].x * w, pts[i].y * h);
    }
    targetCtx.stroke();
    // Also fill a closed shape if enough points
    if (pts.length > 4) {
      targetCtx.fill();
    }
  }

  targetCtx.globalCompositeOperation = prevComp;
}

/**
 * Replay all carvings from state onto targetCtx.
 */
function replayCarvings(targetCtx, w, h) {
  for (const carving of state.carvings) {
    drawCarving(targetCtx, carving, w, h);
  }
}

/**
 * Draw the candle glow radial gradient onto targetCtx.
 * glowColour is a hex string. flickerVal is 0–1.
 */
function drawGlow(targetCtx, w, h, glowColour, flickerVal) {
  const { cx, cy, rx, ry } = pumpkinGeometry(w, h);
  const baseRadius = Math.max(rx, ry) * 1.1 * flickerVal;
  const opacity    = 0.92 * flickerVal;

  // Parse colour to RGB for gradient stops
  const r = parseInt(glowColour.slice(1, 3), 16);
  const g = parseInt(glowColour.slice(3, 5), 16);
  const b = parseInt(glowColour.slice(5, 7), 16);

  const grad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
  grad.addColorStop(0,    `rgba(${r},${g},${b},${opacity})`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},${opacity * 0.7})`);
  grad.addColorStop(0.65, `rgba(${r},${g},${b},${opacity * 0.3})`);
  grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

  targetCtx.save();
  targetCtx.fillStyle = grad;
  targetCtx.fillRect(0, 0, w, h);
  targetCtx.restore();
}

/**
 * Full redraw: background → glow → pumpkin+carvings.
 * The glow bleeds through wherever the pumpkin buffer is transparent (carved).
 */
function redraw() {
  const w = canvas.width;
  const h = canvas.height;

  // 1. Clear main canvas and paint background
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = state.nightMode ? '#050508' : '#2a1500';
  ctx.fillRect(0, 0, w, h);

  // 2. Draw glow onto main canvas first (it will show through carved holes)
  const hex = GLOW_COLOURS[state.glowColour] || '#FF6B00';
  drawGlow(ctx, w, h, hex, state.flickerVal);

  // 3. Build the pumpkin+carvings composite on the offscreen buffer
  offscreen.width  = w;
  offscreen.height = h;
  offCtx.clearRect(0, 0, w, h);

  drawPumpkin(offCtx, w, h, state.nightMode);
  replayCarvings(offCtx, w, h);

  // 4. Composite the pumpkin buffer onto the main canvas (over the glow)
  ctx.drawImage(offscreen, 0, 0);
}

// ─── Flicker animation ────────────────────────────────────────────────────────

function animateFlicker() {
  state.frameCount++;

  // Update flicker at ~12 fps (every 5 rAF frames at 60 fps)
  if (state.frameCount % 5 === 0) {
    // Drift the noise slowly
    state.flickerNoise += (Math.random() - 0.5) * 0.4;
    state.flickerNoise *= 0.85; // mean-revert
    state.flickerVal = 0.85 + 0.15 * Math.sin(Date.now() / 80 + state.flickerNoise);
    state.flickerVal = Math.max(0.7, Math.min(1.0, state.flickerVal));
    redraw();
  }

  requestAnimationFrame(animateFlicker);
}

// ─── Resize handler ───────────────────────────────────────────────────────────

function handleResize() {
  const wrap = canvas.parentElement;
  const size = Math.min(wrap.clientWidth, wrap.clientHeight || wrap.clientWidth);
  canvas.width  = size;
  canvas.height = size;
  redraw();
}

// ─── Stamp application ────────────────────────────────────────────────────────

/**
 * Add a stamp at normalised position (nx, ny) and redraw.
 */
function applyStamp(shape, nx, ny) {
  state.carvings.push({ type: 'stamp', shape, x: nx, y: ny, scale: 1 });
  redraw();
  updateHint();
}

// ─── Erase ────────────────────────────────────────────────────────────────────

function eraseAt(nx, ny) {
  const radius = 0.08; // normalised eraser radius

  state.carvings = state.carvings.filter((c) => {
    if (c.type === 'stamp') {
      const dx = c.x - nx;
      const dy = c.y - ny;
      return Math.sqrt(dx * dx + dy * dy) > radius;
    }
    if (c.type === 'freehand') {
      // Remove stroke if any point falls within radius
      const hit = c.points.some((pt) => {
        const dx = pt.x - nx;
        const dy = pt.y - ny;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });
      return !hit;
    }
    return true;
  });

  redraw();
  updateHint();
}

// ─── Empty-state hint ─────────────────────────────────────────────────────────

function updateHint() {
  if (hintEl) {
    hintEl.hidden = state.carvings.length > 0;
  }
}

// ─── Preset application ───────────────────────────────────────────────────────

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.carvings = preset.map((c) => ({ ...c }));
  redraw();
  updateHint();
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

function initGallery() {
  const thumbs = document.querySelectorAll('.thumb');
  thumbs.forEach((thumbCanvas) => {
    const presetName = thumbCanvas.dataset.preset;
    const tw = thumbCanvas.width;
    const th = thumbCanvas.height;
    const tCtx = thumbCanvas.getContext('2d');

    // Background
    tCtx.fillStyle = '#050508';
    tCtx.fillRect(0, 0, tw, th);

    // Glow
    drawGlow(tCtx, tw, th, '#FF6B00', 0.9);

    // Offscreen pumpkin for thumbnail
    const tOff = document.createElement('canvas');
    tOff.width  = tw;
    tOff.height = th;
    const tOffCtx = tOff.getContext('2d');

    drawPumpkin(tOffCtx, tw, th, true); // thumbnails always look "night" for drama

    const presetCarvings = (PRESETS[presetName] || []).map((c) => ({ ...c }));
    for (const c of presetCarvings) {
      drawCarving(tOffCtx, c, tw, th);
    }

    tCtx.drawImage(tOff, 0, 0);

    // Click → apply preset
    thumbCanvas.addEventListener('click', () => applyPreset(presetName));
    thumbCanvas.parentElement.addEventListener('click', () => applyPreset(presetName));
  });
}

// ─── Random face ("Haunt me") ─────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hauntMe() {
  let attempts = 0;
  let newCarvings;
  let hash;

  do {
    const eye   = pickRandom(ZONES.leftEye);
    const nose  = pickRandom(ZONES.nose);
    const mouth = pickRandom(ZONES.mouth);
    const accent = pickRandom(ZONES.accent);

    newCarvings = [eye, nose, mouth, accent].filter(Boolean).map((c) => ({ ...c }));
    hash = newCarvings.map((c) => `${c.shape}@${c.x},${c.y}`).join('|');
    attempts++;
  } while (hash === state.lastRandom && attempts < 20);

  state.lastRandom = hash;
  state.carvings   = newCarvings;
  redraw();
  updateHint();
}

// ─── Glow colour picker ───────────────────────────────────────────────────────

function setGlowColour(colour) {
  state.glowColour = colour;
  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.colour === colour);
  });
  redraw();
}

// ─── Day / Night toggle ───────────────────────────────────────────────────────

function toggleNight() {
  state.nightMode = !state.nightMode;
  document.body.classList.toggle('night', state.nightMode);
  if (nightToggleBtn) {
    nightToggleBtn.textContent = state.nightMode ? '☀️ Day' : '🌙 Night';
  }
  redraw();
}

// ─── PNG export ───────────────────────────────────────────────────────────────

function exportPNG() {
  const url = canvas.toDataURL('image/png');
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'jack-o-lantern.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Pointer coordinate helper ────────────────────────────────────────────────

function normalisedPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    nx: ((e.clientX - rect.left)  * scaleX) / canvas.width,
    ny: ((e.clientY - rect.top)   * scaleY) / canvas.height,
  };
}

// ─── Tool button highlight ────────────────────────────────────────────────────

function highlightTool(tool) {
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
}

// ─── Canvas pointer event wiring ─────────────────────────────────────────────

function setupCanvasEvents() {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    state.pointerDown = true;
    canvas.setPointerCapture(e.pointerId);
    const { nx, ny } = normalisedPointerPos(e);

    if (state.activeTool && state.activeTool.startsWith('stamp:')) {
      const shape = state.activeTool.slice(6);
      applyStamp(shape, nx, ny);
    } else if (state.activeTool === 'freehand') {
      state.carvings.push({ type: 'freehand', points: [{ x: nx, y: ny }] });
      state.activeStrokeIndex = state.carvings.length - 1;
      updateHint();
    } else if (state.activeTool === 'erase') {
      eraseAt(nx, ny);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!state.pointerDown) return;
    e.preventDefault();
    const { nx, ny } = normalisedPointerPos(e);

    if (state.activeTool === 'freehand' && state.activeStrokeIndex >= 0) {
      state.carvings[state.activeStrokeIndex].points.push({ x: nx, y: ny });
      redraw();
    } else if (state.activeTool === 'erase') {
      eraseAt(nx, ny);
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!state.pointerDown) return;
    state.pointerDown = false;

    if (state.activeTool === 'freehand') {
      state.activeStrokeIndex = -1;
      updateHint();
    }
  });

  canvas.addEventListener('pointercancel', () => {
    state.pointerDown = false;
    if (state.activeTool === 'freehand') {
      state.activeStrokeIndex = -1;
    }
  });
}

// ─── UI event wiring ──────────────────────────────────────────────────────────

function setupUIEvents() {
  // Tool buttons
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeTool = btn.dataset.tool;
      highlightTool(state.activeTool);
    });
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  // Haunt me
  hauntBtn = document.getElementById('haunt-btn');
  if (hauntBtn) hauntBtn.addEventListener('click', hauntMe);

  // Glow swatches
  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => setGlowColour(btn.dataset.colour));
  });

  // Night toggle
  nightToggleBtn = document.getElementById('night-toggle');
  if (nightToggleBtn) nightToggleBtn.addEventListener('click', toggleNight);

  // Export
  exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportPNG);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('main-canvas');
  hintEl = document.getElementById('hint');

  // Fallback guard (REQ-42)
  if (!canvas || !canvas.getContext) {
    if (canvas) canvas.hidden = true;
    const fb = document.getElementById('fallback');
    if (fb) fb.hidden = false;
    return;
  }

  ctx = canvas.getContext('2d');

  // Offscreen pumpkin buffer
  offscreen = document.createElement('canvas');
  offCtx    = offscreen.getContext('2d');

  // Size the canvas to its container
  handleResize();

  // Wire up all events
  setupCanvasEvents();
  setupUIEvents();

  // Initial synchronous draw (REQ-01, REQ-41)
  redraw();

  // Gallery thumbnails
  initGallery();

  // Hint initial state
  updateHint();

  // Start flicker animation
  animateFlicker();

  // Resize listener
  window.addEventListener('resize', handleResize);
});
