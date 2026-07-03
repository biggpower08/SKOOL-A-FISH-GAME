# Fish AI Plan

## Current Pass

Fish now use a fixed, neural-network-like steering layer in
`src/systems/fishSteeringModel.ts`. This is not runtime learning. It is a small
deterministic model with named inputs, fixed weights, and readable outputs that
feed the existing flocking loop.

The model can be disabled with `FISH_NEURAL_STEERING_ENABLED` if the feel needs
to be compared against the older hand-authored steering.

## Inputs

- bias
- fish type evasion and grouping weights
- fish velocity x/y
- school-center direction x/y
- local neighbor density
- nearest shark relative x/y
- nearest shark velocity x/y and speed
- shark closing danger
- shark forward attack direction x/y
- danger-path value
- predicted shark lunge destination relative x/y
- left, right, top, and bottom wall pressure
- current edge pressure x/y

## Outputs

- avoid shark x/y
- sidestep shark path x/y
- avoid wall x/y
- regroup to school x/y
- separate from crowd x/y
- speed urgency

## Baseline Edge Rule

Edge avoidance is not artifact-gated. Fish near walls or corners receive strong
inward pressure even when a shark is dangerous. This may cost fish sometimes,
but it prevents corners from becoming a permanent safe strategy.

## Fish Role Bias

- Tilapia: more group influenced.
- Salmon: balanced.
- Parrotfish: stronger evasive sidestep.
- Mahi-mahi: fast evasive tempo.
- Grouper: steadier and less reactive.

## Shark Disappearance Audit

The current shark update code clamps sharks inside the combat bounds and steers
them back from edges. The renderer only skips sharks that are dead and not in
the starved state. No hidden inactive state or timed visibility toggle was found.
The likely disappearance source was sharks being pushed hard against edges or
behind busy water/school motion; stronger fish edge pressure should make those
encounters easier to read without changing shark lifecycle state.

## Remaining Limitations

- Browser feel still needs a visual pass after this branch is merged.
- The model uses the nearest active shark only. Multi-shark danger still reaches
fish through the existing flee and danger-path steering.
- These weights are intentionally prototype constants, not a trained asset.
