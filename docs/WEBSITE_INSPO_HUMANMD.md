# Website inspo: human-md.ai teardown (Nov 17 2026)

Reference for the Pixie/homie website redo. We take the *techniques and feel*, not their art, copy or characters.

## What it is
A personal manifesto (a markdown file, "HUMAN.md") turned into a scroll-driven **stop-motion film**.
You scroll; a cast of painted cut-out characters acts out each line in little theatrical rooms.
Plain `<article>` with the full text sits underneath for screen readers / reduced motion (`html.reading`).

## Stack (from the bundle)
- Vite build, vanilla JS (no React). One 930 KB JS bundle, one 52 KB CSS.
- **GSAP** core + **ScrollTrigger** + **CustomEase**. **Lenis** smooth scroll.
- **Matter.js** for a few physics bits (paper wads, falling things), with a deliberate jitter so physics looks hand-animated.
- A small custom **WebGL2** sprite renderer (computes signed-distance fields from sprite alpha — used for soft shadows/outlines).
- ~1,400 WebP sprites (~1,000 unique), one image per pose: `pr6-me-aim`, `pr6-me-shoot`, `sk4-pug-0..17`…
- Fonts: **Bricolage Grotesque** (variable, opsz, display/body, weights 300 & 800), **Instrument Serif** (italic accents), **Cutive Mono** (typewriter/markdown bits).

## The engine (the clever part)
1. **One master timeline = the film.** `#stage` is `position:fixed`; `#scroll` is a tall empty div. Scroll position scrubs a single GSAP timeline (`q.tl`). Every scene ("room", `.L` sections) is placed on that timeline at absolute times.
2. **Holds, beats, cues.** The film API is `q.hold(at, secs)`, `q.beat(at, fn)` (fires a little paused timeline when crossed), `q.cue`, `q.stop`. Holds are where the film pauses to let you read.
3. **"Conducted" scroll on desktop.** With a mouse/trackpad, a scroll flick doesn't scrub — it *plays* the film forward to the next hold, at film speed, then waits. Hold length is computed from reading time: `0.8s + 0.3s/word`, `breath .55`, back-scroll unwinds 1.8× faster. Touch devices get plain scrub (`?scroll` / `?flick` URL flags override). Arrow/space/page keys also step.
4. **Stop-motion poses, not tweens.** Characters change by swapping whole painted pose images with `.set(sprite, {pose: X}, t)` on 0.08–0.09s steps (animating "on twos"). Squash/stretch is also stepped: `sx:1.035,sy:.97 → .985,1.02 → 1.012,.992 → 1`. Even the index cards flip in 4 discrete angles (40/85/135/180°) via `data-flip`, not a smooth rotate.
5. **Custom eases with personality** (CustomEase):
   - `camera` `M0,0 C0.62,0 0.22,1 1,1` — slow-in, slow-out dolly (camera moves between rooms)
   - `exit` `C0.3,-0.16 0.62,0 1,1` — tiny wind-up backwards before leaving
   - `reveal` `C0.18,0.82 0.24,1 1,1`, `dive`, `surface`
   - `hop` / `hopSmall` — two-bounce hop curves
   - damped springs generated as curves: `spring(.62,11)`, `springOut(.5,12)`, `bouncy(.34,14)`, `snappy(.78,16)`, `wobble(.18,20)`, `settle(.9,9)`
   - `dolly` — cubic in-out with a 3% overshoot
6. **Text reveals** (`lv(el, start, end, {kind})`): split into chars (0.028s stagger), words (0.045s) or lines (0.075s). Text that hasn't been "read" yet sits in a muted blue and lights to paper/pink via `color-mix(... var(--lit))`.
7. **The orange dot is a character.** One fixed `.dot` (14px, accent orange) travels through the whole film: it's the period on sentences, it strikes words, it's the pocket on her pajamas, the "dot" on the favicon, the HUD file indicator. Continuity device = brand mark.
8. **Preload honestly.** `body.is-loading` hides everything (dark bg first paint, no white flash); opening room is `clip-path:circle(0)` then irises open after images `decode()` (2.5s cap).
9. **Film grain overlay**: inline SVG `feTurbulence` noise at 6% opacity, jittered with `steps(6)` every 0.9s. Cheap, makes everything feel filmed.
10. **HUD**: pill buttons (42px, radius 999, 15px bold), breadcrumb pill that expands with `max-width` transition, an "index" pill opening a full-screen iris (`clip-path: circle()` from the button) with chapter cards. Top-left mascot: a mug whose eye follows you (sprite atlas 13×14 frames via `background-position`).
11. **Landscape phone** gets a cute "this one plays *upright*" screen with the lead lying sideways.

## Design system
- Tokens: `--ink #201e1f`, `--paper #f4efe8`, `--accent #fc4109` (orange dot), `--pink #ffabc8`, `--purple #e7bfff`, cobalt wall `#0b41c2`, ochre `#c7963c`, cream cards `#f3ead8`.
- Every room has its own flat painted wall color (Klein blue, ochre, pink…) with a subtle paint texture tile, plus a floor strip. Rooms = chapters.
- Type: huge tight display (`letter-spacing:-.045em`, weight 800 headline, 300 for big sentences), serif italic for the emotional word ("*(human)*"), mono with orange `##`/`>` markdown glyphs as decoration.
- Fluid sizes via `clamp()`; everything sized in a world unit so rooms scale as one picture.
- Line art: SVG with `vector-effect:non-scaling-stroke` 1px strokes for machines/diagrams next to painted sprites.
- Universal ease for UI: `cubic-bezier(.16,1,.3,1)` (expo-out), 0.5–0.9s.

## The vibe
Wes Anderson staging + Magritte surrealism + Renaissance-painted people in pajamas. Deadpan, specific, funny. Flat rooms, centered compositions, side-on "theater stage" camera. Hand-made feel everywhere: stepped animation, grain, slight physics jitter. Reads like a short film, not a landing page.

## What to steal for Pixie
- **Scroll = a short film about Pixie/homie** with holds sized to reading time. Conducted flick-to-next-beat on desktop, scrub on touch.
- **A traveling brand object**: Pixie herself (the notch character) as the continuity device the way their orange dot is — she peeks out of the notch, becomes the period, rides between scenes.
- **Stop-motion pose swaps** for Pixie instead of smooth tweens; stepped squash/stretch; spring/bouncy custom eases.
- **One room per feature** (music, tasks, screen ink, memory, homie vs homie max), each with its own flat wall color.
- Grain overlay, iris preload, pill HUD with chapter index, plain-text fallback for reduced motion/SEO.
- Cost: their film is ~1,000 painted sprites. Ours should be a handful of rooms and a small Pixie pose set (~20–40 frames) to ship in days, not months.
