# Shell Dev Mode and Recruitment Costs

Runtime code:

- `src/systems/upgrades.ts` owns `DEV_FREE_PURCHASES`.
- `src/systems/fishTypes.ts` owns `recruitmentChoicesForLevel`.
- `src/ui/screens.ts` displays Shell costs and uses `Dev Buy` when development
  mode bypasses affordability.

## Current Rules

- Normal mode requires enough Shells for the selected recruitment choice.
- Development mode can recruit with `0` Shells and never drives Shells negative.
- Recruitment choices still show their real Shell cost in development mode.
- Bundles vary by fish type and level, including mixed Parrotfish/Tilapia and
  larger Mahi-Mahi bundles on selected levels.
- Premium choices remain understandable because the card shows amount, cost, and
  the fish role summary together.

## Guardrails

- Keep `DEV_FREE_PURCHASES` as one explicit constant.
- Do not hide real costs in development mode.
- Do not make recruitment a general shop; fish still join through recruitment
  nodes/test flows, while Shells pay for the selected opportunity.
