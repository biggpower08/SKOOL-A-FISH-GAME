# Artifact Reference

Runtime artifact data lives in `src/systems/artifacts.ts`.

## Current Runtime Shape

Each artifact has:

- `id`
- `name`
- `iconKey`
- `rarity`
- `category`
- `effect`
- `buildTags`
- optional upgrade metadata

Build tags are internal strategy plumbing. The artifact panel shows player-facing
effect, rarity, category, and upgrade cost, but does not expose build-tag labels
as visible card copy.

## Implemented Modifier Pipeline

`src/systems/artifactEffects.ts` turns owned artifact tags into:

- fish speed by type
- fish health by type
- evasion and protection bonuses
- catch resistance
- Shell reward multiplier
- kelp restore bonus
- recruitment bonus by type
- shark hunger drain multiplier
- shark speed multiplier
- risky Shell bonus

The pipeline is intentionally compact. Add new artifact mechanics here before
threading one-off checks through combat, UI, or save code.

## Current Modifier Numbers

- Balanced-school tags add `+1.5%` fish speed and `+0.12` health per fish type,
  capped at `+12%` speed and `+1.5` health.
- Tilapia-swarm tags add `+1` Tilapia to matching recruitment bundles, capped at
  `+3`, plus up to `+1` Tilapia health.
- Parrotfish tags add `+3.5%` parrotfish speed and `+0.04` evasion per tag,
  capped at `+18%` speed and `+0.20` evasion.
- Mahi-Mahi tags add `+4.5%` Mahi-Mahi speed and `+0.025` evasion per tag,
  capped at `+22%` speed and `+0.14` evasion.
- Grouper tags add `+0.75` health and `+0.035` protection per tag, capped at
  `+3` health and `+0.16` protection.
- Salmon tags add `+0.45` health and `+0.025` protection per tag, capped at
  `+2` health and `+0.12` protection.
- Anti-shark tags add `+3.5%` catch resistance and `+4.5%` shark hunger drain
  per tag; they also slow sharks by `2.5%` per tag. Caps are `28%` catch
  resistance, `35%` hunger drain, and `22%` shark slow.
- Shell-economy tags add `+8%` Shell rewards per tag, capped at `+45%`.
- Kelp-recovery tags restore `+2` missing fish per tag, capped at `+6`.
- Risky tags add `+4` Shells after wins, capped at `+20`.

## Baseline-Fix Artifact Cleanup

The old save IDs remain valid, but their visible concepts were reworked so
artifacts are strategy choices rather than basic readability fixes:

- `soft-coral-bumper` is now `Coral Guard Charm`.
- `chill-current-permit` is now `Current Coach Permit`.
- `school-spirit-sash` is now `Rally Spirit Sash`.

Existing saves that own those IDs continue to receive modifiers because runtime
ownership is ID-based.

## Current Gameplay Hooks

- School creation applies fish speed, health, evasion, and protection modifiers.
- Combat attacks apply catch resistance, evasion, and protection modifiers.
- Level rewards apply Shell reward and risky Shell bonuses.
- Kelp recovery applies restore bonuses.
- Recruitment applies recruit bonuses.
- Shark creation applies shark speed modifiers.
- Shark hunger drain applies hunger drain modifiers.

## Stop Points

Check before changing save shape, adding artifact inventory state, adding random
artifact acquisition rules, or making artifacts responsible for baseline school
readability.
