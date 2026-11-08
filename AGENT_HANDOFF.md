# GLASS AHA V2 · Agent Handoff

## Task context

The site is an independent small creative-coding work about **partial visibility**, using an original renderer influenced by the visual exploration of [glass-garden](https://github.com/Johnlzx/glass-garden). The owner's requested V2 direction: **much larger glass, fewer explanatory words, cool blue / pearlescent diffuse light, precise brushes, tactile multi-touch**. These changes are now implemented in the repository.

## What is implemented

- Full-width immersive glass stage; blue editorial design; slim title / scene picker / action bar.
- Original Canvas2D-generated greenhouse, letter and train-window scenes.
- WebGL2 fragment shader with a micro-normal texture, time-varying reflections, blurred refraction and adjustable optical diffusion.
- 512 × 512 dual-channel transient mask: red for local clearing, green for local fog. Brush radius, intensity and lifetime adjustable.
- Drag, long-press blooming, double-click / double-tap ripple, 2-finger pinch to resize, pen pressure, Shift+drag temporary fogging, Alt/Shift+wheel to resize.
- Both erasing fog and painting condensation over a manually revealed scene; no permanent traces saved.
- Canvas2D fallback for no WebGL2; reduced motion, pointer / keyboard affordances, semantic buttons, live announcements.

## Working tree and architecture

- `index.html`: controls, scene buttons, dialog; no build step.
- `style.css`: all tokens, blue UI, responsive transitions, motion fallback.
- `src/main.js`: scene generators -> shader -> WebGL2 setup -> 2D fallback -> mark texture -> input orchestration.
- Deploy as a static website from repo root. Never silently replace this with a screenshot masquerading as glass.

## Next QA / iteration priorities

1. Run in a real GPU-enabled browser. Confirm shader program links, normal texture directions and that red clear brush / green fog brush draw at the same coordinates as the cursor; screenshots in this handoff were taken on the Canvas2D fallback because the remote headless test environment did not expose WebGL2.
2. Test real iOS Safari and Android Chrome multi-touch: pinch scale, finger release during pinch, long press, two quick taps, scrolling only outside the glass. Ensure no pointer capture exceptions.
3. Compare scene compositional quality with typography at 320, 390, 768, 1280 and 1440 px; eliminate any awkward Chinese glyphs or HUD overlaps.
4. Profile masks, GPU samples, and fallback's repeated canvas blurs on low-end devices. Consider caching the fallback base scene and lowering DPR adaptively while preserving responsive clarity.
5. Improve physically grounded condensation: beading, varied evaporation rates, realistic edge meniscus. Keep the UI quiet. Small meaningful interactions over decorative complexity.

## Agent prompt

> Act as an uncompromising interaction designer, shader engineer, and frontend QA lead. Open the GLASS AHA V2 source and inspect the live actual output in desktop and mobile browsers, not just the JSX/HTML. Protect the central idea: opacity is a relationship, not a filter, and revealing everything is never a win condition. Further refine the existing blue light scattering, edge normals, condensation motion, and high-fidelity multi-touch. Test both WebGL2 and Canvas2D fallback, fix gestures and accessibility issues, compare before/after screenshots, and only commit improvements verified in a browser. Do not clutter the experience with explanatory copy, neon glassmorphism, random animations, or AI slogans. Preserve the three scenes and the existing functional controls.

---

## V3 peripheral UI implementation (2026-11-08)

The central `src/main.js` glass engine is deliberately unchanged from V2. The updated `index.html` adds `#ambientBackdrop`, `liquid-ui.css`, and `src/liquid-ui.js`. `src/liquid-ui.js` owns a shared 2D backdrop painted in scene-dependent blue palettes, and mounts per-surface WebGL2 canvases on selected DOM targets (`[data-optics]`). Each uses the same GLSL shader design for rounded SDF clip, interior refraction, wave and asymmetric edge glint. Text, focus and click events always stay in DOM. Scene buttons notify the ambient source to repaint and resample. Resize, scroll and visibility update optics. CSS fallback remains functional when WebGL2 is blocked.

### Next QA iteration

- Visual test on GPU-enabled Chrome and Safari, especially alpha compositing, DPR, rounded clipping, sampling alignment on scroll, and repeated scene changes.
- Performance-profile the per-surface WebGL contexts on midrange Android. Migrate to a single compositor if needed; do not silently reduce interaction fidelity.
- Check 320/390/768/1440 px and reduced-transparency / reduced-motion states, keyboard focus and native `dialog`.
- Keep the editorial blue feeling restrained. The optics UI should be secondary to the central interactive glass.

## Edition 04 — UI refinement
See `DESIGN_AUDIT_V4.md` and `AGENTS.md`. The new presentation-only slider layer is in `precision-ui.css` + `src/precision-ui.js`. Never replace the native range inputs with non-semantic draggable divs. Project level Elaya skill instructions are installed in `.agents/skills/`; override default dark palette/marketing layout with this project's blue material-study direction.
