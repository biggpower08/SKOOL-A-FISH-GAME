# Home Loading School Preview

Runtime code:

- `src/rendering/renderer.ts` owns `drawIdleScene`.
- `src/game/Game.ts` calls `drawIdleScene` for home, saves, pause, choice, and
  game-over screens.

## Current Behavior

- The first screen is still the usable home menu, not a landing page.
- The canvas behind the menu shows the same dark ocean style as combat.
- The preview includes Tilapia, Salmon, Parrotfish, Mahi-Mahi, Grouper, and a
  shark so sprite readability is visible before starting a campaign.
- Fish drift in opposing lanes instead of sitting as a static illustration.

## Guardrails

- Keep the preview lightweight and canvas-native.
- Do not add a separate loading route or marketing hero.
- Keep actual gameplay controls (`Continue Campaign`, `New Campaign`, `Saves`)
  as the first interaction.
- If new fish sprites are added, include them here only when they are readable at
  small scale and do not crowd the menu.
