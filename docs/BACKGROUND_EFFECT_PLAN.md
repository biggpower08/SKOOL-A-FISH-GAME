# Background Effect Plan

This file started as planning only. As of the first water-disturbance prototype,
the chosen direction is a tiny Canvas-native low-resolution disturbance field.
Do not expand it into full wave physics, WebGL, shader displacement, or a port
of an external repo without a future focused pass.

## Current Status

- The game uses a dark aquatic Canvas gradient.
- Subtle current lines help the scene feel underwater without stealing focus.
- Existing entity disturbance marks are lightweight and should not become the
  main background system in this pass.
- The black/dark background still supports sprite readability.
- A prototype `WaterDisturbanceField` now supports `touch`, `update`, `draw`,
  and `resize`.
- Fish and sharks can touch the field at their positions; shark touches are
  stronger, fish touches are subtle and throttled.

## What Looks Good Now

- Dark first-read, with fish and shark sprites clearly visible.
- Quiet current-line motion.
- No busy water texture fighting the school.
- GitHub Pages-friendly Canvas implementation with no extra dependency.
- The first field prototype draws behind sprites and above the static
  background/current lines.

## What Has Not Worked So Far

- Large entity-centered pulse rings can become distracting.
- Tail-slash-looking marks make the water feel like combat VFX instead of an
  environment.
- Too much reactive motion can hide fish movement and make counts feel less
  readable.

## Do Not Implement Yet

- Wave equations.
- Full water simulation.
- Full-screen ripple physics.
- Shader/WebGL displacement.
- Background systems that change collision or gameplay.
- New dependencies just for water effects.
- jQuery, Pixi, Three, or a direct port of `jquery.ripples`, WaterCanvas, or
  `webgl-water`.

## Possible Future Approaches

1. Simple sinusoidal wave layers: a few soft line bands with slower drift.
2. Low-resolution ripple field: cheap grid influence rendered as faint shade.
   This is the current prototype direction.
3. Flow field / vector field currents: subtle direction cues that can influence
   background only, not fish physics.
4. Canvas displacement illusion: redraw low-alpha offset strips to fake water.
5. Sprite-aware disturbance marks: small marks around moving sprites, kept
   secondary to the fish/shark silhouettes.
6. Shader/WebGL later: only if Canvas cannot deliver the desired look.
7. No effect / clean background: keep the current quiet backdrop if it supports
   gameplay better.

## Research Questions

- Should the water look calm, arcade-like, ominous, or satirical?
- Should movement marks follow fish, sharks, or only big shark events?
- How much water motion can the game tolerate before fish counts feel unclear?
- Should later artifact/fish effects alter background color or motion?
- Is the Steam-polish direction hand-painted, shader-like, or clean flat Canvas?

## Future Acceptance Criteria

- The chosen background direction improves readability and game feel.
- Fish and shark sprites remain the first visual read.
- No background effect hides catches, red threat tint, or X-eyes.
- The implementation remains GitHub Pages-friendly.
- Ponytail discipline still applies: prove one background idea before building a
  complete water engine.
- The current field should remain subtle, performant with 40+ fish, and easy to
  disable or replace if later research points elsewhere.

## Link Back To Live Prompts

`docs/LIVE_PROMPTS.md` remains the live source of truth. This file is only the
parking lot for future background research and acceptance criteria.
