# Jack-o'-Lantern Studio — Product Steering

## Product Vision

Jack-o'-Lantern Studio is a browser-based pumpkin-carving toy. The user opens a single page, picks a carving tool, and clicks or drags on a canvas pumpkin to cut a face into it. Carved openings glow from a flickering candle inside. At night the room darkens and the glow becomes the only light source. The result can be downloaded as a PNG and shared.

The experience is self-contained and instant: no login, no install, no waiting for assets to load. Everything ships in three files (HTML, CSS, JS). The tone is spooky but playful — the kind of thing you show a coworker for ten seconds and they smile.

## Target User

Anyone with a browser and thirty seconds of curiosity. The primary audience is people browsing the Kiroween 2026 hackathon showcase — judges and other participants who will skim many projects quickly. A first-time visitor must understand what to do without reading any instructions beyond the empty-state hint text.

## Kiroween 2026 — Costume Contest Category

The Costume Contest category rewards any app with a polished, haunting UI. Jack-o'-Lantern Studio wins on that axis by making the UI itself the product: the visual experience of candlelight bleeding through carved pumpkin holes, the room-darkening night mode, and the orange-on-black palette are the demo. Judges see the effect within two seconds of opening the page.

## Hard Technical Constraints

| Constraint | Rationale |
|---|---|
| Single static site — one HTML file, one CSS file, one JS file | Works from any static host (GitHub Pages, S3, file://). No build step, no bundler, no framework. |
| No external assets | The pumpkin is drawn with Canvas 2D vector paths. No images, no SVGs fetched over the network, no icon fonts, no web fonts. |
| No CDN dependencies | No `<script src="https://...">` or `<link href="https://...">`. Everything inlines or loads from the same origin directory. |
| No backend | No server, no API, no service worker required. |
| System font stack only | `font-family: system-ui, -apple-system, sans-serif` throughout. |
| Must work at 390 px viewport width | The canvas and all controls reflow to a single-column layout at mobile width. |
| Pumpkin always renders | The canvas draws the pumpkin body on every paint. A blank screen is never acceptable, even before the user carves anything. |
| PNG export via Canvas API | `canvas.toDataURL('image/png')` — no server-side rendering. |
