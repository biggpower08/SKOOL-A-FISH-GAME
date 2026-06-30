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
- kelp recovery that restores missing fish toward max fish count
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

Every completed round should pause at a clean intermission. Normal intermissions
offer kelp recovery, investment, or Continue. Artifact and recruitment choices
still happen only on their intervals or path nodes.

Development currency editing can exist for testing. Simple controls like `[` to
decrease Shells and `]` to increase Shells are enough. Do not build a debug
economy menu.

## Fish Recruitment

Fish join through recruitment levels, not through normal currency purchases.

Dead fish stay dead for the run. If the shark catches five fish, those fish are
gone until the player spends resources on kelp recovery. Kelp restores missing
fish toward the current max fish count and cannot exceed capacity unless the
player earns new fish through recruitment.

New fish can join through:

- planned recruitment levels every 5 or 7 levels
- specific level-path recruitment nodes
- rare reward/recruitment events later

Recruitment choices can offer fish groups such as:

- several tilapia
- a few salmon
- one grouper
- a few fast fish
- future damage or debuff fish

Fish should have different strategic identities, but they can all use the same
placeholder circle visual for now.

The goal is roster strategy, not infinite replacement purchases. Fish loss
should matter, and the school should change over time.

## Artifact and Healing Shop

The shop should focus on:

- buying artifacts
- kelp recovery that restores missing fish toward max fish count
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
- The current artifact panel and Hidden cards are a good direction. Do not
  redesign them unless they conflict with a necessary gameplay fix.
- Visible artifact cards can be clickable for dev/testing. Clicking should add,
  select, or toggle the artifact in a simple way. Hidden cards should remain
  hidden and non-selectable.

## Round Intermissions, Kelp, and Investment

Every completed round should show a break/intermission popup. Do not show full
artifact or recruitment choices every round, but do give the player a clean
between-round decision.

Intermission rules:

- Normal rounds show `Feed Kelp`, `Invest Shells`, and `Continue`.
- Normal intermission option cards should look balanced and easy to scan; a
  two-option popup should not look lopsided.
- Artifact reward rounds still show artifact choices on the 3rd completed
  round interval.
- Recruitment rounds still show adoption choices on the 5th completed round
  interval, and recruitment wins when both intervals line up.
- Popup style should stay close to the existing compact overlay style.
- The player can go Home or End Run from between-round screens.
- Kelp, investment, artifact rewards, and adoption should only appear after
  won/survived rounds. Losing should go to game over/end-run flow and should
  not allow recovery.

Max fish rules:

- `maxFishCount` is the highest current party capacity earned this run.
- `fishCount` is the currently alive school count.
- `missingFishCount = maxFishCount - fishCount`.
- Shark kills reduce current fish count after the round.
- Recruitment increases current fish count and can increase max fish count.
- Recovery cannot exceed max fish count.

Kelp recovery rule:

- `Feed Kelp` costs Shells.
- First simple version: spend 100 Shells to restore up to 5 missing fish.
- Kelp should restore toward max fish count only.
- Kelp should use minimal text and should not become a complex healing system
  yet.

Investment rule:

- `Invest Shells` spends 100 Shells now.
- After 3 completed rounds, the investment returns 200 Shells.
- If the run ends before return, the investment is lost.
- If the player has less than 100 Shells or already has a pending investment,
  the investment choice should be disabled or unavailable.
- The return should appear as a short `Investment Returned` popup.

## Dev Level Scroller

Add a small dev/testing level scroller at the top center of the screen.

Rules:

- It should be labeled minimally, such as `DEV`.
- It should show about five level boxes at once.
- Horizontal scroll over the control should move through levels.
- Clicking a level should deliberately jump to/start that level for testing.
- It should work during active gameplay and from home if practical.
- It should not crowd the sidebar or become a player-facing progression UI yet.
- It should support testing level 70+ without fancy animation or menus.

## Round One Balance

Round one should be dangerous and predictable before upgrades matter.

- Default campaign start should be around 30-40 normal fish. Current active
  target is 36 Tilapia and no active Support Fish.
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

Current active fish types:

- Tilapia: common/normal, low health, stable schooling, number fish.
- Salmon: normal, medium health, medium speed, reliable generalist.
- Parrotfish: fast, higher speed, better evasion, lower durability.
- Mahi-mahi: fast, very high speed, low-medium health, high evasion.
- Grouper: tank, high health, slow speed, survives pressure.

Support Fish is removed from active gameplay for now. New campaigns should not
start with Support Fish, recruitment should not offer Support Fish, and legacy
saves with Support Fish should be converted or ignored safely.

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
entity-centered pulsating circles during combat. Ripples should read as water
disturbance, not UI pulses or shark tails.

Current visual rule: do not use the old pulse/circle wave effect around units or
health displays. Prefer animated gradients and faint flowing current lines behind
entities. Fish and sharks must remain readable against the background.

Ripple direction:

- Preserve the current gradient and flowing current-line background.
- Use lightweight Canvas ripple particles: expanding, fading, slightly
  stretched ellipses.
- Shark ripples should be larger and more visible than fish ripples.
- Successful bites can emit a stronger shark ripple for feedback.
- Fish ripples should be tiny/faint and only appear when fleeing or at a
  throttled cadence.
- Avoid tail-like slash marks behind sharks.
- Avoid huge perfect rings around every unit.
- Do not add WebGL, shader, jQuery, or external ripple dependencies for this.
- The provided Python/NumPy ripple reference represents a height-field wave
  buffer and refraction idea. Do not port it directly; a cheap visual
  approximation is enough for this prototype.

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

Between-level special reward popups should be interval-based, but every
completed round should still show a break popup.

Current simple rule:

- every 3rd completed round: artifact choice popup
- every 5th completed round: fish recruitment/adoption popup
- if both happen on the same completed round, prefer fish recruitment
- normal rounds should show the compact break popup with kelp, investment, and
  Continue

Fish adoption popup rules:

- Fish are not bought with currency.
- Adoption options must use `Adopt` buttons.
- Options should cover Tilapia, Salmon, Parrotfish, Mahi-mahi, and Grouper.
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
future artifacts, and player choices. Fish should steer away from edges before
hard clamping and should get stronger corner avoidance so corners do not become
safe traps. The round-one 18% lethality target remains active.

Sharks should remain fast and aggressive, but they should not wedge into canvas
edges or corners. When a shark hits a boundary, dampen or redirect wall-pushing
velocity and steer it back into the arena without teleporting.

## Shark Bite Recovery and Fish Lifecycle

Shark eating should feel intentional and readable without stopping the shark.

- On a successful catch, the shark should continue chasing smoothly.
- `feedingRecovery` can remain only as a tiny visual-feedback timer under
  about 0.1 seconds.
- Do not use bite recovery to slow, pause, or circle the shark for balance.
- Catch feedback should come from the caught-fish fade and a stronger water
  ripple, not from movement interruption.
- Caught fish can linger for a tiny visual fade so fish do not appear to
  randomly pop out of existence.
- Caught/fading fish are not counted as alive in the active HUD.
- Fish count, fish type summaries, and completed-round run state should all use
  one alive-visible source of truth.
- Fish with invalid or non-finite position/velocity should be clamped or reset
  instead of producing NaN movement.
- Fish deaths should be clearly tied to shark catches or round transitions.

## Sprite Integration Prep

Sprites are future polish. Placeholder circles remain the working fallback.

Sprite rules:

- Do not generate or commit final sprites until explicitly requested or
  provided.
- Use one fish type at a time when sprites begin.
- Transparent background is required.
- Bold/simple cartoon outline is preferred so fish remain readable on dark
  water.
- Single-frame sprites are acceptable first.
- Two-frame flip-flop animation can come later.
- If a sprite is missing or fails to load, render the placeholder circle.

Tiny future manifest shape:

```ts
type SpriteManifestEntry = {
  spriteKey: string;
  src: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  fallbackColor: string;
};
```

Tone direction for future fish art:

- colorful
- satirical
- hippie/new-wave
- simple cartoon personality
- customization page later, with hats, little accessories, googly eyes, color
  variants, and silly details

Do not build customization now.

## Tone

The game can eventually have a light satirical edge, but do not add lots of
copy. Tiny labels are enough when already touching UI. Examples: `Feed Kelp`,
`Questionable Investment`, `Totally Safe Artifact`, `Hidden`, or `The School
Endures`.

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
- Every completed round shows a break popup.
- Normal breaks offer kelp recovery, investment, and Continue.
- Current fish/max fish should be visible enough to understand recovery.
- A top-center dev level scroller exists for quick level testing.
- Visible artifacts are clickable for dev/testing.
- Shark/fish ripple marks are subtle water effects, not tail slashes or
  full-screen pulse rings.
- Shark feeding recovery is visual-only and should not pause shark movement.
- Fish counters should match alive visible fish; caught/fading fish are not
  counted as alive.
- A tiny sprite manifest shape exists for future transparent-background fish
  sprites, but circles remain the fallback.

## Planned Fish Type Order

1. Salmon or Basic Fish
2. Tilapia
3. Parrotfish
4. Grouper
5. Mahi-mahi

Support/healing fish can return later as a future class, but it should not be an
active current unit.

Fish types may share placeholder circle visuals first. They should eventually
have different stats, readable shop/side UI identity, and survival impact. No
sprite requirement for the first fish-type pass.
