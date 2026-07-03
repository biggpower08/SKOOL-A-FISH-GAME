# Artifact Visual Plan

## Goal

Keep artifact cards readable now, then add small transparent icon assets later
without creating a heavy asset pipeline.

## Card Rules

- Desktop panel keeps a five-card row when space allows.
- Each card should show icon placeholder, name, rarity, true effect, owned or
  available status, and upgrade status when present.
- Do not show internal build tags or debug categories as player-facing copy.
- Effects should describe implemented behavior, not hoped-for future systems.

## First Icon Priorities

1. Shark Tooth Charm: shark pressure and hunger.
2. Bubble Net: fish evasion.
3. School Bell: school cohesion.
4. Pearl Cache: Shell economy.
5. Kelp Bandage: recovery.
6. Drift Scale: fast fish survival.

## Sprite/Icon Rules

- Transparent PNG with true alpha.
- One readable object per icon.
- Thick cartoon outline and high contrast at small size.
- No text, UI panels, fake checkerboard transparency, or water background.
- Keep fallback glyphs available until every icon exists.

## Later Priority Groups

- Movement and AI artifacts.
- Recovery and kelp artifacts.
- Shell economy artifacts.
- Shark debuff artifacts.
- Risky/satirical artifacts once their risk behavior is real.
