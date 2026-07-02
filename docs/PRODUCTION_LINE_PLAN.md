# SKOOL-A Fish Game Production-Line Plan

## Activation Status

- `qa/harden-workstreams-1-3` merged into `main` after tests, build, coverage, audit, and Playwright browser smoke passed.
- Resulting hardening/base commit: `09d8b813e4be5ee6dfcccf019a4722ccd7ebea95`.
- Sidebar fish health bars are fixed: bars render below fish names/counts in the HUD fish rows.
- ECC production-line mode is active: one branch, one scope, one verification report.
- `main` is stable and should only receive reviewed merges or small production-line housekeeping commits.

Active lane branches to create from updated `main`:

```txt
fix/fish-balance-polish
fix/recruitment-recovery-polish
feature/artifact-mechanics
feature/fish-ai-danger
feature/run-progression-feedback
```

## Current Branch Strategy

- `main` is the stable deployable branch. Do not run multiple Codex sessions directly on `main`.
- Hardening work from `qa/harden-workstreams-1-3` has been accepted into `main`.
- Focused follow-up branches should branch from the latest `main`, then merge back in small reviewed chunks.
- Each lane should have one owner/session at a time when it touches shared gameplay state.

Recommended lanes:

```txt
qa/harden-workstreams-1-3
fix/fish-balance-polish
fix/recruitment-recovery-polish
feature/artifact-mechanics
feature/fish-ai-danger
feature/run-progression-feedback
```

## Parallel Work

These can usually proceed in parallel if they avoid the same files:

- Visual ocean polish: renderer colors, wake visibility, sprite readability.
- Artifact copy/design documentation: docs and artifact metadata planning.
- Browser smoke automation notes: test scripts and QA checklists.
- UI text polish for non-overlapping screens.

## Sequenced Work

These should be sequenced because they share run state, combat timing, or save shape:

- Fish balance before fish AI danger tuning.
- Recruitment/recovery rules before artifact mechanics that modify recruitment/recovery.
- Save-state migrations before any branch that reads new run fields.
- Level progression feedback after recruitment/recovery and artifact reward timing settle.

## Merge Order

1. `qa/harden-workstreams-1-3` - merged
2. `fix/fish-balance-polish`
3. `fix/recruitment-recovery-polish`
4. `feature/artifact-mechanics`
5. `feature/fish-ai-danger`
6. `feature/run-progression-feedback`

If two branches touch the same shared file, merge the smaller hardening branch first and rebase the larger feature branch.

## Conflict-Risk Files

- `src/game/Game.ts`
- `src/game/types.ts`
- `src/systems/upgrades.ts`
- `src/systems/fishTypes.ts`
- `src/systems/combat.ts`
- `src/systems/flocking.ts`
- `src/rendering/renderer.ts`
- `src/ui/screens.ts`
- `src/ui/hud.ts`
- `src/systems/save.ts`

Treat these as single-lane files unless the changes are clearly independent.

## Testing Requirements

Run before pushing any implementation branch:

```powershell
npm test
npm run build
npm run test:coverage
npm audit --audit-level=moderate
```

For gameplay-state changes, add or update focused tests first. Keep coverage above 80%; current target is 90%+ statements.

## Browser Smoke Requirements

Use Playwright for each branch that affects gameplay, visuals, or UI:

- Home screen loads.
- New Campaign starts combat.
- Ocean remains dark and readable.
- Old shark ellipse ripple stays gone.
- Fish wakes are visible but not noisy.
- Fish sprites and shark sprites render.
- Fish bob/tilt feels alive without distorting position.
- Live/total fish counter updates.
- Game continues while any non-shark fish remain.
- Recruitment panel shows quantities and Shell costs.
- Unaffordable Shell-gated recruits are disabled.
- Recovery feedback appears once and updates fish totals.
- Artifact panel opens and still shows all cards.
- Build label is visible.
- Console has no game-breaking errors.

## Stop Points

Check back with ChatGPT before:

- Merging `qa/harden-workstreams-1-3` to `main`.
- Starting `feature/artifact-mechanics`.
- Changing save-state shape again.
- Raising or lowering starting fish count.
- Changing shark attack catch rate or game-over rules.
- Adding fish AI danger behavior.

## Current Hardening Notes

- Workstreams 1-3 are playable but still need browser-feel judgment, not just passing tests.
- Early hardening found feedback stacking in recruitment/recovery screens and a background that could go darker.
- Keep future hardening small: polish what the player sees, then stop.
