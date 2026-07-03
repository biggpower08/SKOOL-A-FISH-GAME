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
