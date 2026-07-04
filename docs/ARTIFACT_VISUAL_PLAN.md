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

## Placeholder Asset Set

Original SVG placeholders now live in `public/assets/icons/`:

- `shell.svg` for Shell economy and reward UI.
- `fish.svg` for school size, recruitment, and fish-count UI.
- `shark.svg` for enemy status and anti-shark artifacts.
- `treasure-chest.svg` for artifact rewards and shop/economy cards.

These are repo-owned placeholders, not downloaded clipart. They are safe to use
until final transparent PNG artifact icons are generated or commissioned.

Cleaned transparent PNG assets from the July asset pack now live in:

- `public/assets/ui/shell_icon_transparent.png`
- `public/assets/ui/fish_counter_icon_transparent.png`
- `public/assets/ui/kelp_icon_transparent.png`
- `public/assets/ui/treasure_chest_icon_transparent.png`
- `public/assets/sharks/grog_steampunk_hat_shark_clean.png`
- `public/assets/sharks/bill_bandana_shark_clean.png`
- `public/assets/sharks/steezy_nose_piercing_shark_clean.png`

Runtime code should reference these through `src/rendering/assetPaths.ts` so the
GitHub Pages base path stays correct.

## Sprite/Icon Rules

- Transparent PNG with true alpha.
- SVG placeholders are acceptable only for generic UI/icon scaffolding.
- One readable object per icon.
- Thick cartoon outline and high contrast at small size.
- No text, UI panels, fake checkerboard transparency, or water background.
- Keep fallback glyphs available until every icon exists.

## Transparent Icon Prompt Rules

- Ask for one centered object on a transparent background.
- Keep the object fully visible with no crop.
- Use chunky cartoon shape language and a dark outline.
- Avoid tiny written labels, UI cards, water scenes, and realistic stock-photo
  texture.
- Match the artifact's implemented function. If an artifact only adds `+8%`
  Shell rewards, show a Shell/economy object rather than promising a shop
  discount.

## Later Priority Groups

- Movement and AI artifacts.
- Recovery and kelp artifacts.
- Shell economy artifacts.
- Shark debuff artifacts.
- Risky/satirical artifacts once their risk behavior is real.
