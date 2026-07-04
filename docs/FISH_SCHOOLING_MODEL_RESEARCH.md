# Fish Schooling Model Research

Audit date: 2026-07-04
Branch: `research/fish-schooling-model-scout`
Main audited: `88fed8bfcfa5086c8b5de714a6853c0725050be0`

## Purpose

Fish movement should become a signature feature of SKOOL-A-FISH-GAME, not a pile of tuning constants. This pass does not implement gameplay code. It scouts movement models, license posture, and a concrete next implementation path for a fish-schooling behavior engine.

## Current Repo Failure Modes

- Fish movement in `src/systems/flocking.ts` is still mostly a single summed steering formula: separation, crowd pressure, alignment, cohesion, shared school intent, flee, danger-path escape, open-water escape, edge pressure, optional neural steering, and water current all add into one velocity.
- The current `openWaterEscape` already samples 8 directions, but only when a fish is threatened or chain-alarmed. It scores shark distance, center bonus, and edge penalty, but not density, kelp, memory, or predicted group congestion.
- The current kelp behavior in `src/game/Game.ts` is a simple positive goal when no shark is close. It refreshes after timeout or when the school center gets near it. It is not consumable, stateful, or tied to density.
- The current kelp renderer in `src/rendering/renderer.ts` draws one kelp asset with a static green glow. It does not start desaturated, light up under fish, fade, or respawn based on fish interaction.
- Fish still have no explicit behavior mode. A fish does not know whether it is foraging, schooling, alert, fleeing, or recovering; it only receives weights indirectly through local threat flags and constants.
- Edge pressure alone is structurally weak. Increasing edge push can move the stable clump from a corner to a side wall or just outside the pressure band, because the fish are still solving a local force-balance problem.
- Shark visual state may read incorrectly. In `src/rendering/renderer.ts`, `sharkTintFor` applies orange tint below `0.68` health and red tint below `0.35` health, while actual defeat is `health <= 0` or `starved`. Players may interpret the red/orange tint as death before the shark is actually defeated.

## Why Edge Pressure Alone Is Not Enough

The current movement resembles a reactive potential-field controller: each fish receives attraction and repulsion vectors, then moves along the sum. Potential-field style movement is efficient and easy to tune, but it often creates local minima where forces balance out in bad places. In this game that looks like edge camping, corner clumping, and predictable split groups.

The fix should be a decision layer above steering. A fish should first decide what behavior mode it is in, then use different steering priorities for that mode. This makes the movement feel intentional while preserving cheap Canvas-era boid math.

## Models Researched

### 1. Craig Reynolds Boids and Steering Behaviors

Sources:
- Craig Reynolds, "Steering Behaviors For Autonomous Characters": https://www.red3d.com/cwr/steer/gdc99/
- OpenSteer: https://opensteer.sourceforge.net/
- OpenSteer GitHub mirror: https://github.com/meshula/OpenSteer

Useful ideas:
- Keep steering as a middle layer between high-level goals and low-level locomotion.
- Use simple local rules for emergent schooling rather than direct global control.
- Treat goal seeking, obstacle avoidance, flocking, and pursuit/evasion as composable behaviors, but do not always run them all at maximum weight.

License notes:
- OpenSteer is MIT licensed according to both SourceForge and the GitHub mirror.
- Safe to study and potentially adapt code if the MIT notice is preserved. For this project, prefer reimplementing the concepts in TypeScript because OpenSteer is C++ and broader than this game needs.

Recommended reuse:
- Reuse concepts: behavior layering, seek/flee/arrival, obstacle avoidance, prioritized steering.
- Avoid direct code copy unless we add attribution and retain MIT license text.

### 2. Couzin-Style Zone-Based Schooling

Sources:
- Couzin, Krause, James, Ruxton, Franks, "Collective memory and spatial sorting in animal groups": https://doi.org/10.1006/jtbi.2002.3065
- Accessible summary and citation page: https://researchportal.bath.ac.uk/en/publications/collective-memory-and-spatial-sorting-in-animal-groups/
- PDF copy used for algorithm review: https://jmvidal.cse.sc.edu/library/couzin02a.pdf

Useful ideas:
- Replace one blended neighbor radius with zones:
  - zone of repulsion: very near neighbors trigger collision avoidance and have highest priority.
  - zone of orientation: middle-distance neighbors influence heading alignment.
  - zone of attraction: outer neighbors pull the fish back toward the group.
- Add a perception field or blind volume later if needed, but skip it at first.
- Small parameter changes can produce major group transitions, which is exactly why SKOOL-A should avoid blind constant tuning.

License notes:
- Academic paper/pseudocode is not a code library. Use the algorithmic model as inspiration; do not copy article text or figures into the game.

Recommended reuse:
- Reimplement the zone logic in `src/systems/flocking.ts` or a new movement module.
- Preserve fish type identity by changing zone sizes or mode thresholds per fish type.

### 3. Huth/Wissel Fish School Movement

Sources:
- Huth and Wissel, "The simulation of the movement of fish schools": https://www.sciencedirect.com/science/article/pii/S0022519305806812
- OpenAIRE metadata summary: https://oamonitor.ireland.openaire.eu/rfo/sfi_rfo/search/publication?pid=10.1016%2Fs0022-5193%2805%2980681-2
- Review article on behavioural analyses to models of collective motion in fish schools: https://pmc.ncbi.nlm.nih.gov/articles/PMC3499128/

Useful ideas:
- Individual fish can be driven by nearest-neighbor position and orientation, not whole-school state.
- The model direction is more fish-specific than generic boids and supports the idea that school behavior can be believable without a leader.

License notes:
- Academic model, not directly reusable code. Reimplement concepts only.

Recommended reuse:
- Use nearest-neighbor/limited-neighbor rules to prevent global panic.
- Consider fish-type-specific neighbor count or zone widths.

### 4. Predator-Prey Fish Evasion Models

Sources:
- "Behavior pattern (innate action) of individuals in fish schools..." abstract: https://www.sciencedirect.com/science/article/abs/pii/S0022519305000056
- Artificial Fishes paper by Tu and Terzopoulos: https://web.cs.ucla.edu/~dt/papers/alifej94/alifej94.pdf
- Predator avoidance fish-school demo page: https://gupett.github.io/CG-Project/

Useful ideas:
- Predator evasion should be a mode switch, not merely a stronger flee vector.
- Models often separate schooling, cooperative escape, and selfish escape with different behavior weights.
- Prey can school when predator is distant, then scatter or choose evasive paths when the predator is near.

License notes:
- Academic papers and project demos are references, not code sources unless their repositories and licenses are checked separately.

Recommended reuse:
- Map SKOOL-A modes to `school`, `alert`, `flee`, and `recover`.
- Treat shark proximity and attack-lane danger as mode inputs.

### 5. Vector Field Histogram / Sector Steering

Sources:
- Borenstein and Koren, "The Vector Field Histogram - Fast Obstacle Avoidance for Mobile Robots": https://www.cs.cmu.edu/~motionplanning/papers/sbp_papers/integrated1/borenstein_VFHisto.pdf
- MathWorks VFH overview: https://www.mathworks.com/help/nav/ug/vector-field-histograms.html
- VFH local-minima/trap discussion: https://www.sciencedirect.com/science/article/pii/S2590123024008806

Useful ideas:
- Use a grid or local histogram to reduce the world into candidate directions.
- Choose the best steering sector instead of moving directly away from a predator.
- Score directions by danger, open space, edge risk, density, and continuity.

License notes:
- Algorithmic research and documentation. Reimplement the idea; do not copy code or proprietary examples.

Recommended reuse:
- Extend current `openWaterEscape` into a `bestSectorEscape` scorer.
- Score 8 or 12 directions using shark distance, predicted shark lane, interior safety, fish density, recent visit penalty, and kelp value.

### 6. Spatial Hash / Density Grid Boids Repos

Sources:
- `cubedhuang/boids`: https://github.com/cubedhuang/boids
- `jtsorlinis/BoidsWebGPU`: https://github.com/jtsorlinis/BoidsWebGPU

Useful ideas:
- Spatial subdivision makes neighbor lookup explicit and gives us a natural place to track density.
- The grid should not only optimize; it can also become gameplay intelligence by making crowded cells less attractive.

License notes:
- Both repos show MIT license on GitHub.
- They are safe to inspect and can be adapted with MIT attribution if actual code is copied.
- For SKOOL-A, do not copy WebGPU or rendering code. Reimplement a tiny 2D grid tailored to the current Canvas game.

Recommended reuse:
- Reimplement a low-resolution grid in TypeScript:
  - cell size around `48` to `72` px.
  - fish density count.
  - shark danger score.
  - edge penalty.
  - kelp attraction.
  - recent visit penalty.

### 7. Licensing Guidance

Sources:
- Choose a License MIT summary: https://choosealicense.com/licenses/
- GitHub licensing docs: https://docs.github.com/articles/licensing-a-repository

Rules for this repo:
- Prefer conceptual adaptation and fresh TypeScript implementations.
- Only copy code from sources with a clear permissive license such as MIT, BSD, or Apache-2.0.
- If copying any non-trivial code, add attribution and preserve required license notices.
- Do not copy academic paper text, figures, or unlicensed GitHub code.
- Treat demos, blog posts, and StackOverflow-like snippets as inspiration unless a license is explicit.

## Recommended Architecture

### Core Types

```ts
export type FishBehaviorMode = "forage" | "school" | "alert" | "flee" | "recover";

export type BehaviorWeights = {
  separation: number;
  alignment: number;
  cohesion: number;
  kelp: number;
  edge: number;
  flee: number;
  sectorEscape: number;
  density: number;
  wander: number;
};

export type SchoolingCellScore = {
  density: number;
  sharkDanger: number;
  edgePenalty: number;
  kelpAttraction: number;
  recentVisitPenalty: number;
  interiorBonus: number;
};

export type KelpGoalState = "dormant" | "feeding" | "consumed" | "respawning";
```

### Behavior Modes

Use behavior modes as the first implementation layer. Do not introduce all systems at once.

Suggested first weights:

```ts
const behaviorWeights = {
  forage: { separation: 1.0, alignment: 0.45, cohesion: 0.55, kelp: 1.4, edge: 0.45, flee: 0, sectorEscape: 0, density: 0.8, wander: 0.25 },
  school: { separation: 1.0, alignment: 0.8, cohesion: 0.75, kelp: 0.5, edge: 0.55, flee: 0, sectorEscape: 0, density: 0.55, wander: 0.18 },
  alert: { separation: 1.15, alignment: 0.65, cohesion: 0.5, kelp: 0.15, edge: 0.8, flee: 1.1, sectorEscape: 0.6, density: 0.8, wander: 0.08 },
  flee: { separation: 1.45, alignment: 0.2, cohesion: 0.15, kelp: 0, edge: 1.25, flee: 2.4, sectorEscape: 1.5, density: 1.1, wander: 0 },
  recover: { separation: 1.0, alignment: 0.7, cohesion: 0.8, kelp: 0.9, edge: 0.7, flee: 0.25, sectorEscape: 0.2, density: 0.65, wander: 0.14 },
} satisfies Record<FishBehaviorMode, BehaviorWeights>;
```

Mode selection should be deterministic and testable:

- `forage`: no active shark near the school or fish; kelp available.
- `school`: no immediate shark danger and fish is not near kelp.
- `alert`: shark is near enough to matter, but fish is outside direct bite/attack-lane danger.
- `flee`: shark is close, fish is in direct threat radius, or fish is in a predicted shark lane.
- `recover`: fish recently left flee/alert mode or kelp was consumed.

### Density Grid

Add a low-resolution grid as a separate module before wiring it deeply into flocking.

Responsibilities:

- Map positions to cell ids.
- Count living fish density by cell.
- Score edge penalty and interior bonus.
- Score shark danger by distance to active sharks.
- Score kelp attraction by distance to active kelp.
- Track recent school-level or fish-level visited cells.

Do not use A* or navmesh. The arena is open water; the grid exists to prevent bad local choices and crowding, not to solve maze navigation.

### Best-Sector Escape

Replace or evolve `openWaterEscape` into a reusable sector scorer:

```ts
score =
  sharkDistanceScore
  + interiorBonus
  + kelpScore
  + continuityBonus
  - edgePenalty
  - crowdPenalty
  - predictedSharkPathPenalty
  - recentVisitPenalty;
```

Start with 8 directions because the repo already does this. Move to 12 directions only if browser QA shows jagged movement.

### Kelp Lifecycle and Tint

Kelp should become ecology, not just a target.

Lifecycle:

- `dormant`: gray/desaturated kelp, low attraction.
- `feeding`: fish overlap increases progress; kelp gains color/tint.
- `consumed`: kelp fades out; attraction drops to zero.
- `respawning`: timer runs; new kelp appears in a safe interior cell.

Implementation notes:

- Store kelp as an object in `Game.ts`, not only `{ pos, radius }`.
- Add `progress`, `alpha`, and `state`.
- Fish overlap should be based on living fish inside kelp radius, but use a cap so 54 fish do not consume instantly.
- Renderer can reuse current sprite tinting style: draw desaturated gray for dormant, stronger green as progress rises.

### Local Memory

Start with school-level memory, then add fish-level memory only if needed.

```ts
type SchoolMovementMemory = {
  recentCells: string[];
  lastThreatDirection: Vector;
  recoverUntil: number;
  lastKelpTargetId?: string;
};
```

Use memory to:

- Penalize repeated edge/corner cells.
- Keep recover mode from immediately flipping back into panic.
- Add continuity to sector choice so fish do not jitter between equally scored directions.

### Fish Type Identity

Use current fish definitions:

- Tilapia: high schooling, low individual strength. Should follow local group and density signals strongly.
- Salmon: balanced. Good baseline.
- Parrotfish: support/evasion. Should detect shark danger a little earlier and help nearby fish enter alert rather than full panic.
- Mahi-Mahi: fast. Should get stronger sector escape and recover quickly.
- Grouper: tank. Should flee less sharply, preserve cohesion more, and avoid becoming the whole school anchor.

## Recommended Implementation Phases

1. `feature/fish-behavior-modes`
   - Add `FishBehaviorMode`.
   - Add pure mode selection helper with tests.
   - Apply mode weights to existing steering formula.
   - Preserve current playability.

2. `feature/kelp-lifecycle-feeding`
   - Replace simple `KelpGoal` with stateful kelp.
   - Add gray-to-green tint and consumption/fade/respawn.
   - Add smoke dataset fields for kelp state/progress.

3. `feature/school-density-grid`
   - Add grid scoring module.
   - Use it first for kelp placement and crowd penalty.
   - Then feed score into behavior modes.

4. `feature/best-sector-escape`
   - Evolve `openWaterEscape`.
   - Score edge, crowding, shark danger, predicted attack lane, kelp, and continuity.
   - Make flee mode choose open water instead of pure anti-shark vector.

5. `feature/school-local-memory`
   - Add recent cell penalties and recover cooldown.
   - Avoid per-fish memory until the school-level version proves useful.

6. `qa/fish-schooling-model-tuning`
   - Browser-playtest the whole model at 54 fish and later levels.
   - Tune mode thresholds and weights only after architecture is in place.

## Tests Needed

Unit tests:

- Mode selector returns `forage`, `school`, `alert`, `flee`, and `recover` under deterministic shark/kelp/memory conditions.
- Zone-based neighbor helper prioritizes repulsion over alignment/attraction.
- Density grid maps fish to cells and gives crowded cells a worse score.
- Kelp placement avoids edge/corner cells and overly crowded cells.
- Kelp progress increases with fish overlap, transitions to consumed, fades, and respawns.
- Best-sector escape does not choose a wall-bound direction when an interior route is available.
- Shark tint thresholds do not imply death at half health; death/starvation state is distinct.
- Existing `schoolEnergy <= 0` non-loss behavior remains intact.

Browser QA:

- 54 starting fish do not immediately blob into a corner.
- Fish in forage mode visibly move toward interior kelp without stacking directly on it.
- Kelp starts gray, lights up while fish feed, fades when consumed, and respawns elsewhere.
- Far shark creates alert behavior without full-school panic.
- Close shark triggers local flee and sector escape.
- Fleeing fish avoid driving straight into the wall when open water exists.
- School reforms after a shark leaves instead of staying split or edge-clumped.
- Parrotfish/Mahi-Mahi/Grouper movement identities remain readable.
- Shark orange/red tint is understandable and does not look like premature death.
- Sidebar starvation meter and actual shark disappearance agree with game state.

## What We Can Safely Reuse

Safe conceptual reuse:

- Reynolds steering behavior layering.
- Boids separation/alignment/cohesion.
- Couzin repulsion/orientation/attraction zones.
- Huth/Wissel nearest-neighbor fish-school thinking.
- VFH-style sector scoring and density histograms.
- Predator-prey mode switching and fear/evasion propagation.

Potential code reuse with attribution:

- OpenSteer MIT code, if a small algorithmic helper is worth translating.
- MIT boids repo spatial-grid ideas from `cubedhuang/boids` or `jtsorlinis/BoidsWebGPU`, if a specific implementation detail is needed.

Recommended default:

- Reimplement from the algorithm descriptions. The game needs a small TypeScript movement engine, not a port of a C++ steering library or a WebGPU boids simulator.

## Exact Next Branch Prompt

Plain-English Summary:
Implement the first step of the SKOOL-A-FISH-GAME fish-schooling model engine: behavior modes and mode-based steering weights. Do not implement the full density grid, kelp lifecycle, or local memory yet. Preserve playability and keep the change small enough to browser-QA.

Caleb

Branch:
`feature/fish-behavior-modes`

Goal:
Replace the current always-on steering soup with a lightweight behavior-mode layer that chooses `forage`, `school`, `alert`, `flee`, or `recover`, then applies mode-specific steering weights to the existing flocking vectors.

Rules:
- Do not copy outside code in this branch.
- Use the research doc as the source of design truth.
- Keep current fish, shark, artifact, and recruitment systems working.
- Preserve kelp goal rendering as-is except for passing enough state into flocking if needed.
- Do not add density grid, kelp consumption, or local memory yet.

Implementation:
- Add `FishBehaviorMode` and `behaviorWeights`.
- Add a pure mode selector with tests.
- Use local shark distance, attack lane danger, kelp availability, and recent threat flag if available.
- Apply weights to existing steering terms instead of adding a second movement system.
- Keep `openWaterEscape` but weight it by mode.
- Keep large-school shared intent modest.

Tests:
- Mode selector returns all modes under deterministic conditions.
- Far shark does not put all fish into flee.
- Close shark puts only locally threatened fish into flee.
- Kelp/no-shark case favors forage.
- Flee mode reduces cohesion and increases separation/escape.
- School-energy-zero loss guard still passes.

Browser QA:
- New Campaign enters combat.
- 54 fish remain readable and do not immediately corner-clump.
- Fish drift toward kelp/interior when safe.
- Close shark still feels dangerous.
- Fish do not jitter badly.
- Artifact panel still opens.
- No broken images or console-breaking errors.

Do not merge automatically.
