# GLASS AHA — The Art of Almost Seeing

A quiet, blue-toned interactive glass experiment. Three windows; three reasons to keep part of a view out of focus. Version 2 is designed for touch, not for reading long explanations.

**Concept:** Clarity is a choice, not a victory condition.

## Explore

| Gesture | Result |
| --- | --- |
| Drag / one-finger swipe | Temporarily clears an area of glass |
| Hold still | The mark slowly blooms |
| Pinch with two fingers | Resize the brush radius |
| Double-tap / double-click | Paint a soft circular ripple |
| Choose **凝雾** | Paint condensation instead of removing it |
| Reveal all, then use **凝雾** | Reintroduce localized fog over a clear image |
| Shift + drag | Temporarily paint condensation |
| Alt/Shift + scroll on the glass | Resize brush without hijacking ordinary page scroll |

The control dock exposes **brush radius 22–180 px**, **pressure 20–100%**, **recovery time 3–22 s**, and **diffusion 0–100%**. Pen pressure is supported where pointer hardware provides it. `←/→` switch scenes, `B` switches brush, `+/-` changes radius, `R` reveals, and `Escape` resets. Essential content remains visible; a manual reveal option means the experience never requires precision gestures.

## Scenes

- **等雨停 / After the Rain** — moisture on a greenhouse window.
- **没寄出的信 / The Unsent Letter** — a private note behind frosted glass.
- **末班车的窗 / The Last Train** — rainy city light behind a moving window.

All three illustrations are procedurally rendered with Canvas2D. No personal data or touch traces are saved.

## Run / deploy

This is a zero-dependency static site, using WebGL2 + GLSL and a Canvas2D fallback. No npm installation is required.

```bash
python3 -m http.server 5173
```

Open `http://localhost:5173` or publish the repository root with GitHub Pages, Vercel, or Netlify. The HTML uses relative paths for static hosting. Fallback rendering and pointer interactions also work without WebGL2. The layout supports desktop and mobile, reduced-motion preferences, and screen reader status announcements.

## Files

- `index.html` — compact experience layout and controls
- `style.css` — diffuse blue editorial design, responsive / reduced-motion treatment
- `src/main.js` — three original procedural scenes, normal maps, GLSL refraction, dual-channel brush mask, gestures, fallback renderer
- `DESIGN_RATIONALE.md` — ideas behind the three reasons to blur
- `AGENT_HANDOFF.md` — implementation / QA continuation notes

## Credits

Independent study inspired by [Johnlzx/glass-garden](https://github.com/Johnlzx/glass-garden)'s experimentation with glass normals, light and refraction. No upstream code or images were copied. The result is a design-oriented real-time renderer, not a physically exact optical simulation. Optional Google Fonts have system fallbacks.
