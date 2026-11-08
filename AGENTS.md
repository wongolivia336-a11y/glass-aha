# GLASS AHA · project agent instructions

This is a small experimental interactive art project, not a SaaS landing page. Preserve the central glass experience in `src/main.js` and its existing touch gestures.

## Installed skill references
- `.agents/skills/redesign-existing-projects/SKILL.md` — use the **audit** and incremental-fix process.
- `.agents/skills/landing-page-design/SKILL.md` — use the typography, spacing, radius, state, motion, and accessibility QA principles.

**Project-specific overrides**: retain the blue diffusion palette, environmental glass gradients and existing Chinese/English editorial composition. Do not import the skills' default dark palette, conversion/CTA sections, or ban the background gradients that serve the artwork. Avoid over-animated controls.

## Technical modules
- `src/main.js`: the central WebGL/Canvas2D glass engine and scene gestures.
- `src/liquid-ui.js`: shared blue environmental background and peripheral GPU refraction surfaces.
- `src/precision-ui.js`: native-range overlay instruments, moving mode membrane, local light response.
- `precision-ui.css`: refined micro-interaction and slider material layers.

## Acceptance checks
Check 1440, 820, 390 and 320px; no horizontal overflow; native keyboard ranges, pointer hover, pressed/focus, reduced motion, chapter switching, clean/fog toggle, reset/reveal, help, About. Never make the custom visual slider the sole accessible interaction control. The GPU optical result needs visual testing on a real graphics-enabled browser.
