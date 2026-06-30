# SKOOL-A Fish Game Agent Instructions

These instructions apply to this repository only.

For design prompts, balance notes, sprite prompts, and future rules, use
`docs/LIVE_PROMPTS.md` as the source of truth.

## Project North Star

Build the first GitHub Pages-ready prototype for a fish-school autobattler roguelite.

- The player manages fish.
- Sharks are enemies.
- The first prototype uses simple circles on a dark aquatic background.
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
- Start with a black/dark aquatic background.
- Flocking first.
- Minimal text.
- Many levels should just be fish vs sharks.
- Clear round end: shark starves or fish lose.
- Level path should preview what is coming.
- Fish are recruited through level events, not bought directly with currency.
- Currency is for artifacts, healing, investment, and future shop effects.
- Dead fish stay dead for the run.
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
- Shark hunger draining over time.
- Shark hunger restoring when a shark catches fish.
- Round victory when all active sharks starve or expire.
- Starved sharks stopping and showing X eyes or an equivalent clear visual.
- Starting shark attacks catching about 18% of nearby or available fish.
- Side HUD with shark health.
- Side HUD with shark type counts and hunger/composition summary.
- Side HUD with compact fish type counts and health pips.
- Level path preview showing current and upcoming level types.
- Subtle Canvas water shading; avoid distracting entity-centered ripple circles.
- Artifact edge icon with a placeholder overlay.
- Between-level choices: recruit on recruitment nodes, buy placeholder artifacts, invest currency, heal/replenish energy, go home, or end run.
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
- Tilapia, Salmon, Parrotfish, Mahi-mahi, Grouper, and Support Fish: named
  placeholder-circle fish types with distinct early stats; no faction system yet.

Initial sharks:

- Basic Shark: large dark circle, targets the closest fish, attacks periodically, visible hunger/health.
- Fast Shark: dark circle with a speed mark, faster chase speed, lower hunger/health.
- Pack-Center Shark: dark circle with a center dot, targets the school center.
- Barracuda/Striker: thin dark oval, targets isolated or outer fish.
- Eel Placeholder: data structure support only until line attacks are needed.

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

## Codex MCP Workflow

Use `docs/MCP_WORKFLOW.md` for this repo's Codex MCP workflow.

- Use Playwright for browser-visible game checks, UI bugs, console errors, and
  focused end-to-end smoke tests.
- Use Context7 when current Vite, Vitest, TypeScript, or dependency
  documentation matters.
- Use Sequential Thinking before multi-file gameplay changes, debugging passes,
  save migrations, refactors, or test strategy changes.
- Perplexity and Firecrawl were not detected when the workflow note was added;
  do not rely on them unless `codex mcp list` shows they are connected.
- Do not rewrite the project just because MCPs are available. MCPs support
  Ponytail discipline; they do not replace it.

Acceptance checks:

- Game opens to a basic home screen.
- `New Campaign` starts a run.
- `Continue Campaign` reads localStorage when available.
- Fish appear as small placeholder circles on a dark aquatic canvas.
- Sharks appear as large dark circles.
- Fish flock and flee.
- Fish turn red near sharks.
- Sharks chase and attack automatically.
- Sharks are faster than individual basic fish by default.
- Starting shark attacks catch about 18% of nearby or available fish.
- Shark hunger/health is visible in a side HUD.
- Starved sharks stop and show X eyes.
- Enemy composition counts are visible in the side HUD.
- The level path preview shows current and upcoming levels.
- Combat water shading is visible but subtle.
- Fish type health pips are visible when fish exist.
- Artifact edge icon opens a placeholder overlay.
- Between-level choices exist.
- Fish are not directly bought with currency.
- Healing does not revive dead fish.
- Player can return home or end a run.
- Browser app does not try to close the tab.
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
