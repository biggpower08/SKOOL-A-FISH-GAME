# SKOOL-A-FISH-GAME Live Prompts

Use this file as the editable source of truth for Codex prompts, balance notes,
sprite prompts, and future design instructions. Do not create scattered Markdown
prompt files.

## Core Do-Not-Drift Rules

- Player manages fish.
- Sharks are enemies.
- Use Ponytail discipline.
- Start with circles, not sprites.
- Black/dark aquatic background first.
- Flocking first.
- Minimal text.
- Many levels should just be fish vs sharks.
- Clear round end: shark starves or fish lose.
- Level path should preview what is coming.
- Level 70 should be achievable.
- Level 70+ should be difficult.
- Fish factions later.
- More shark types later.
- Steam polish later.
- GitHub Pages prototype now.

## Ponytail Discipline

Ponytail discipline:
Caleb

Make the smallest correct implementation. Do not redesign the whole game. Do
not add unnecessary architecture. Keep all changes isolated to this repo. Keep
the game playable. Use placeholder circles/icons first unless sprites are
specifically requested. Do not overbuild systems.

When unsure, choose the simpler working version.

## Currency System

Working currency name: `Shells`.

Currency is for:

- buying artifacts
- healing or replenishing school energy
- future shop effects
- possible artifact/shop upgrades later

Currency is earned through:

- surviving rounds
- rare reward levels
- artifact effects
- investment choices
- possible shark starvation bonuses

Currency should not directly buy normal fish.

Round rewards should start as meaningful Shells, not single digits. Early fight
rewards should land around 100-200 Shells, with a simple upward curve such as
`150 + level * 10`. Reward nodes can add a small bonus.

Healing, investment, and recruitment should appear on intervals or level-path
nodes. Most levels should remain ordinary fish-vs-shark fights.

Development currency editing can exist for testing. Simple controls like `[` to
decrease Shells and `]` to increase Shells are enough. Do not build a debug
economy menu.

## Fish Recruitment

Fish join through recruitment levels, not through normal currency purchases.

Dead fish stay dead for the run. If the shark catches five fish, those fish are
gone. Healing can restore school energy or living fish durability later, but it
does not revive dead fish.

New fish can join through:

- planned recruitment levels every 5 or 7 levels
- specific level-path recruitment nodes
- rare reward/recruitment events later

Recruitment choices can offer fish groups such as:

- several tilapia
- a few salmon
- one grouper
- one support fish
- a few fast fish
- future damage or debuff fish

Fish should have different strategic identities, but they can all use the same
placeholder circle visual for now.

The goal is roster strategy, not infinite replacement purchases. Fish loss
should matter, and the school should change over time.

## Artifact and Healing Shop

The shop should focus on:

- buying artifacts
- healing fish or restoring school energy
- improving future rewards later

The shop should not sell normal fish directly.

Artifacts should become a major strategy system later. They can support:

- healing fish
- buffing fish classes
- improving flocking
- strengthening support fish
- improving recruitment
- reducing shark speed
- reducing shark hunger
- disrupting shark targeting
- increasing currency gain
- improving survival after fish deaths
- creating risky high-reward builds

The game should support strategy, not pure RNG. Use both specific unlocks and
limited random choices later.

## Artifact Collection / Artifact Section

The game should eventually support around 120 individually named artifacts.
Do not create 120 artifacts now.

Artifacts should eventually appear in an artifact section. The MVP direction is:

- small artifact icon/button on the edge of the screen
- placeholder-only at first
- panel later for collected artifacts, locked artifacts, names, icons, rarity,
  and effects

Future artifact shape:

```ts
type Artifact = {
  id: string;
  name: string;
  iconKey: string;
  rarity: "common" | "rare" | "legendary" | "mythic";
  description: string;
  tags: string[];
  unlocked: boolean;
};
```

Artifact acquisition can come from:

- shop purchases
- rare reward levels
- specific unlock achievements
- starving certain shark types
- reaching level milestones
- using certain fish classes
- investment returns
- limited random choices

First implementation should start with an artifact section placeholder icon,
a simple data shape if needed, and 3 to 6 example artifacts only when gameplay
requires them.

The active combat screen should include a small artifact icon/button on the
screen edge. It can open a placeholder overlay with minimal text such as
`Artifacts`, `No artifacts yet`, and `Future collection`. The overlay should not
be a full inventory yet and should not create the 120-artifact system now.

Current artifact panel rules:

- Title must be `Artifacts`.
- Use a 5-column grid when space allows.
- Show the six basic starter artifacts: Shark Tooth Charm, Bubble Net, School
  Bell, Pearl Cache, Kelp Bandage, and Drift Scale.
- Future/unknown slots should say `Hidden`.
- Hidden slots can use a tiny fog/cloud placeholder animation.
- Keep cards short: icon, name, rarity/status, and one short effect.
- Do not build the full 120-artifact collection yet.

## Round One Balance

Round one should be dangerous and predictable before upgrades matter.

- Default campaign start should be around 30-40 normal fish plus one support
  fish. Current target is 36 Tilapia plus one Support Fish.
- Sharks are visibly faster than individual basic/common fish.
- Round-one shark attacks target roughly 18% of available fish.
- With 36 starting normal fish, the first round should reliably remove around
  six to seven fish when the shark gets an attack.
- Preserve the shark starvation win condition.
- Later outcomes can swing based on fish types, upgrades, artifacts, shark
  types, and level scaling.

Use named balance constants for default fish count, round-one target catch rate,
round-one catch count, shark speed, shark acceleration, attack cooldown, attack
radius, and reward values when practical.

## Fish Types and Side UI

Fish types are active gameplay data while still using placeholder circles.

Current fish types:

- Tilapia: common/normal, low health, stable schooling, number fish.
- Salmon: normal, medium health, medium speed, reliable generalist.
- Parrotfish: fast, higher speed, better evasion, lower durability.
- Mahi-mahi: fast, very high speed, low-medium health, high evasion.
- Grouper: tank, high health, slow speed, survives pressure.
- Support Fish: support/healing identity, medium durability, supports school
  energy and needs visible health.

The side UI should stay compact:

- level number
- fish remaining/count
- Shells
- compact fish type rows with type marker, label/count, class implied by label,
  and health pips or group health
- compact shark type/hunger rows
- artifact edge icon
- pause/home access through existing controls

Avoid long active-combat descriptions, verbose path text, energy explanations,
and crowded side text.

## Background and Water Direction

The background should remain dark but not flat black forever. Use subtle
Canvas-only animated dark blue, purple, black, and gray shading. Avoid obvious
entity-centered pulsating circles during combat. If ripples remain, keep them
very subtle and non-distracting.

Current visual rule: do not use the old pulse/circle wave effect around units or
health displays. Prefer animated gradients and faint flowing current lines behind
entities. Fish and sharks must remain readable against the background.

## HUD and Health Bar Cleanup

Active combat HUD should stay compact. Keep level, fish alive, Shells, a clean
school energy/health bar, compact fish type health summaries, compact shark
hunger/starvation summaries, and the artifact edge button.

Avoid:

- repeated path/reward detail during combat
- tiny decorative circles around the total school health bar
- oversized fish type rows
- full ability descriptions
- debug text unless explicitly dev-mode

Shark status bars should guard against broken values:

- show one clear hunger/starvation bar in the active HUD
- avoid duplicate shark health bars during combat
- clamp hunger ratios between 0 and 1
- guard against zero max hunger
- show hungry/starved and multi-shark summaries without overflow
- keep bars compact enough that multiple shark types remain readable

## Reward Popup Timing

Between-level reward popups should be interval-based, not every round.

Current simple rule:

- every 3rd completed round: artifact choice popup
- every 5th completed round: fish recruitment/adoption popup
- if both happen on the same completed round, prefer fish recruitment
- normal rounds should go straight to the next fight or use only a minimal
  continue step if needed

Fish adoption popup rules:

- Fish are not bought with currency.
- Adoption options must use `Adopt` buttons.
- Options should cover Tilapia, Salmon, Parrotfish, Mahi-mahi, Grouper, and
  Support Fish.
- Each option should show a placeholder fish marker, fish name, class, short
  identity, amount added, and `Adopt`.
- Adopted fish join future rounds and dead fish remain dead.

Artifact reward popup rules:

- Artifact choices use `Take` buttons.
- Taking an artifact adds it to owned artifacts.
- Owned artifacts should appear in the artifact panel.
- Keep artifact effects light; do not build the full collection now.

## Fish Movement Speed

Fish should feel more alive than the first prototype pass. Base fish speeds and
flee response can be increased, but basic/common fish must not outrun a
round-one shark one-on-one. Fish survive through flocking, flee behavior,
support, future artifacts, and player choices. The round-one 18% lethality
target remains active.

## Home / Exit / Leave Run Flow

The game needs a clear way to leave the current screen or return home.

Required navigation:

- Home
- End Run
- Back
- Continue

During gameplay:

- `Esc` can open a pause/menu if practical.
- Pause menu can include Continue, Home, and End Run.
- Home should save and return to the home screen.
- End Run should abandon the run and clear the save.

During between-level screens:

- player can continue the run
- player can go home
- player can end the run
- save/continue later should work if a save exists

For a browser game, Leave App should not try to close the browser tab. Use Home,
End Run, or Save and Return Home instead.

## Current Implemented Direction

- Fish win rounds by surviving until shark hunger reaches zero.
- Fish lose if all fish are caught or school energy reaches zero.
- Shark hunger drains over time and restores when sharks catch fish.
- Starved sharks stop and show X eyes before the between-level screen.
- Shark speed is higher than basic fish speed by default.
- Starting shark attacks target roughly 18% of fish in the attack window.
- A level path preview shows current and upcoming level icons.
- Fish type HUD shows compact counts and health pips by fish type.
- Enemy HUD summarizes active shark hunger/starvation by type.
- Shells are visible in the HUD.
- Combat background uses subtle animated dark water shading and current lines
  instead of obvious entity-centered ripple circles.
- Artifact edge icon opens a minimal placeholder overlay.

## Planned Fish Type Order

1. Salmon or Basic Fish
2. Tilapia
3. Support Fish
4. Parrotfish
5. Grouper
6. Mahi-mahi

Fish types may share placeholder circle visuals first. They should eventually
have different stats, readable shop/side UI identity, and survival impact. No
sprite requirement for the first fish-type pass.
