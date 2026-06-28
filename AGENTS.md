# SKOOL-A Fish Game Agent Instructions

These instructions apply to this repository only.

## Project North Star

Build the first GitHub Pages-ready prototype for a fish-school autobattler roguelite.

- The player manages fish.
- Sharks are enemies.
- The first prototype uses simple circles on a black background.
- Flocking comes before polish.
- The game should be playable in a browser and deployable to GitHub Pages.
- The GitHub Pages target is `https://biggpower08.github.io/SKOOL-A-FISH-GAME/`.
- The long-term dream is Steam-level polish, but this repo should move in small, correct prototype steps.

## Ponytail Discipline

Ponytail discipline means: make the smallest correct implementation that proves the game loop.

Use this as a stop sign before adding anything.

- Do not invent new systems unless the current task requires them.
- Do not add finished sprites, asset pipelines, complex menus, ECS, physics engines, or procedural content frameworks in the first prototype.
- Prefer readable TypeScript and plain Canvas over clever architecture.
- Keep text minimal in the game UI.
- Keep files and concepts easy to inspect.
- Every change should make the prototype more playable, more buildable, or easier to continue.

## Do-Not-Drift Rules

- Player manages fish.
- Sharks are enemy units and enemy waves.
- Start with circles, not sprites.
- Start with a black background.
- Flocking first.
- Minimal text.
- Many levels should just be fish vs sharks.
- Level 70 should be achievable with a strong run.
- Level 70+ should be difficult.
- Fish factions are later.
- More shark types are later.
- Steam polish is later.
- GitHub Pages prototype is now.

## Core Prototype Requirements

The first playable implementation should include:

- Home screen with `Continue Campaign`, `New Campaign`, and `Saves`.
- Browser game built with Vite, TypeScript, and Canvas unless a browser stack already exists.
- Many small white fish circles.
- One or more large dark shark circles.
- Fish flocking with separation, alignment, cohesion, and shark flee behavior.
- Fish turning red when a shark gets close.
- Sharks automatically chasing the school.
- Sharks attacking periodically.
- Starting shark attacks catching about 18% of nearby or available fish.
- Side HUD with shark health.
- Side HUD with support fish health bars when support fish exist.
- Between-level choices: add fish, invest currency, or replenish fish energy.
- Basic localStorage save/continue support.

The flocking loop should stay close to:

```ts
for (const fish of school) {
  const near = around(fish);
  const sep = avoid(near);
  const ali = align(near);
  const coh = center(near);
  const flee = escape(fish, shark);
  fish.vel += sep + ali + coh + 3 * flee;
  fish.pos += limit(fish.vel);
}
```

## Level Discipline

Use a simple level config function or compact generator. Do not build a huge procedural generation system.

Target pacing:

- Levels 1-5: tutorial/basic shark pressure.
- Levels 6-15: more fish, faster sharks, basic support fish.
- Levels 16-30: shark health/damage scaling and stronger panic pressure.
- Levels 31-50: more dangerous combinations and energy pressure.
- Levels 51-70: serious scaling; strong fish choices should matter.
- Levels 70+: hard extended-run territory.

Rough distribution:

- 70% normal fish-vs-shark fights.
- 15% shop/recovery/investment levels.
- 10% special shark modifier levels.
- 5% rare reward or faction-choice levels.

Many levels should be ordinary combat. Do not add a new mechanic every level.

## Initial Data Shapes

Keep future expansion possible without implementing the future yet.

```ts
export type LevelConfig = {
  level: number;
  type: "fight" | "shop" | "investment" | "special" | "reward";
  sharkCount: number;
  sharkHealth: number;
  sharkSpeed: number;
  sharkAttackRate: number;
  fishThreatRadius: number;
  rewardCurrency: number;
};
```

Initial fish:

- Basic Fish: small white circle, flocks, turns red when threatened, can be caught.
- Support Fish: slightly larger white/blue circle, visible side health bar, simple support effect.
- Future Fish Placeholder: data structure only; no faction system yet.

Initial sharks:

- Basic Shark: large dark circle, chases school or nearest fish, attacks periodically, visible health.
- Difficult Shark Placeholder: data structure only; do not implement many shark types yet.

## Suggested Structure

Use this structure if starting from an empty repo:

- `src/main.ts`
- `src/game/Game.ts`
- `src/game/types.ts`
- `src/game/input.ts`
- `src/entities/Fish.ts`
- `src/entities/Shark.ts`
- `src/entities/School.ts`
- `src/systems/flocking.ts`
- `src/systems/levels.ts`
- `src/systems/combat.ts`
- `src/systems/upgrades.ts`
- `src/systems/save.ts`
- `src/rendering/renderer.ts`
- `src/ui/screens.ts`
- `src/ui/hud.ts`

Add less if less is enough. Ponytail discipline wins over directory symmetry.

## Verification

Before claiming the prototype is done, run:

- `npm install`, if dependencies are missing.
- `npm run build`.
- `npm test`, if a test script exists.

Acceptance checks:

- Game opens to a basic home screen.
- `New Campaign` starts a run.
- `Continue Campaign` reads localStorage when available.
- Fish appear as small white circles on black.
- Sharks appear as large dark circles.
- Fish flock and flee.
- Fish turn red near sharks.
- Sharks chase and attack automatically.
- Starting shark attacks catch about 18% of nearby or available fish.
- Shark health is visible in a side HUD.
- Support fish health bars are visible when support fish exist.
- Between-level choices exist.
- Level scaling can reach about level 70.
- Level 70+ is difficult through stat scaling.
- No finished sprites are required.

## External Action Boundaries

Stay isolated to this repository unless the user explicitly approves otherwise.

- Do not modify global Codex config.
- Do not modify files outside this repo.
- Do not push, publish, deploy, or change third-party resources without explicit approval.
- Networked tools are read-only by default.
- Preserve user config and private state.

## Final Response Shape

For implementation tasks, end with:

1. Plain-English summary.
2. Files changed.
3. Commands run and results.
4. Acceptance criteria status.
5. Remaining issues.
6. Suggested git commit message.
