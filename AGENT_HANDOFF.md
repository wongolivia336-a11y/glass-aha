# GLASS AHA / Agent Handoff

## Your role
Act as an independent Creative Technologist, Shader Engineer, Interaction Designer, and demanding QA reviewer. This is not a standard frosted-glass component. It is a small interactive essay about the ethics and pleasure of partial visibility.

## Product brief
**Core statement:** Clarity is not the victory condition. Blurring is a designable relationship between the viewer and the viewed. This project should make that relationship tactile without becoming mystical, text-heavy, or visually noisy.

**Three scenes:**
1. After the Rain — condensation comes from weather; wiping reveals botanical details.
2. The Unsent Letter — an unaddressed letter; revealing is a temporary choice, not an entitlement.
3. The Last Train — moving cities and the impossibility of seeing inside/outside at once.

**Interaction contract:** pointer down / touch then drag to clear; slowly regains fog after 6–9 seconds. Different chapters have different glass responses. Reveal All is a user-controlled accessibility path. R toggles reveal; ←/→ change windows; Escape restores fog. No user input is stored.

## Repository and code
- Destination: https://github.com/wongolivia336-a11y/glass-aha
- `index.html`: semantic layout, copy, controls and modal
- `style.css`: editorial layout, responsive design, microinteractions, reduced-motion behavior
- `src/main.js`: procedurally illustrated scenes, native WebGL2 shader, generated normal texture, pointer-trace mask, controls, Canvas2D fallback
- `README.md`: technical and conceptual guide
- `favicon.svg`: authored icon
- No build tool/dependencies needed; serve with `python3 -m http.server 5173` from root.
- Acknowledgment: original study is independent, inspired by the upstream `Johnlzx/glass-garden` project. Do not copy third-party assets/code without a verified license.

## Immediate QA priorities
1. Verify in a real desktop browser (Chromium, Firefox, Safari), plus mobile touch. Test WebGL2 success and forced fallback in a no-WebGL context.
2. Inspect the actual rendered visuals at ~1440x900, 768x1024, 390x844, 320x700. Fix clipped copy, overprints, overlay/cursor relations, horizontal overflow, touch affordance.
3. Drag across edges, tap rapidly, switch chapter mid-drag, re-fog mid-animation, reveal/re-hide, open/close dialog using keyboard, switch away/back to tab, test loss/restore of WebGL context.
4. Profile GPU cost on integrated laptop and a midrange mobile phone. Limit shader samples and DPR if necessary; avoid heat/battery drain.
5. Validate pointer UV / canvas texture orientation: brushing top left must reveal top left. Verify in the WebGL path and Canvas2D fallback.
6. Check brush fading when crossing paths (no discontinuities), scene transition after rapid clicks, keyboard focus indicators and screen-reader announcements.

## Next creative iteration (not compulsory; use taste)
- Make fog feel physically specific: a little condensation beading after a held contact, more precise microscopic normals and rim lighting; avoid generic glowing gradients.
- Strengthen the narrative rewards: each scene should contain one small discoverable detail, not a hidden motivational slogan.
- Consider audio only with explicit opt-in, grounded in each physical scene.
- Add a thoughtful loading/fallback state for extremely slow devices.
- Refine drawing quality with hand-authored assets only if clearly better than algorithmic illustration. Keep editorial white space and avoid AI-generated-looking iconography.

## Guardrails
No permanent clear state as a hidden "win"; do not put essential information behind blur. Avoid oversized inspirational claims, fake glassmorphism dashboard UI, neon gradients, or gratuitous motion. Treat motion reduction and manual reveal as non-negotiable. Make each state meaningful, accessible, and beautiful.

## Acceptance criteria
The site loads without package installation. All three windows present visibly different scenes and material characteristics. A pointer or finger clears and re-fogs a local region. The clear-image button works without interaction. Responsive at 320–1440+ px. Zero unhandled JS errors in standard browsers. Source and deploy instructions remain in the GitHub repo.

## One-paragraph execution prompt
> Audit and polish GLASS AHA as a serious creative-coding portfolio piece, not a demo filter. Inspect the full repository and live rendered UI, preserve its three intentional reasons for blur and the principle that clarity is not the goal, and raise optical fidelity, illustrated scene quality, pointer/touch feedback, keyboard accessibility, responsiveness, and performance to a professional standard. Do not merely add effects or rewrite the poetic copy. Evaluate each detail as a physically and conceptually motivated choice. Verify desktop and mobile interactions with browser screenshots and tests, repair failures, then commit the finished source to the repository with a concise evidence-based report.
