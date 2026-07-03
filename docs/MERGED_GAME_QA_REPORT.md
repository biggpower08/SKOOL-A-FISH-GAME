# Merged Game QA Report

Audit date: July 3, 2026

Main commit audited: `b95d363ff0d9b1fd216bdbeca9df07dfdcb56802`

Branch: `qa/merged-game-balance-audit`

## What Was Tested

- Repo state, merged branch history, and current gameplay/data files.
- Fish spacing, danger-path steering, large-school intent, combat survival, recruitment, recovery, artifact modifiers, HUD, and run summary tests.
- Live app availability through the Vite dev server at `http://127.0.0.1:5184/`.
- Browser automation attempts through the available MCP/tooling path.

## Issues Found

- Artifact cards contained several specific promises that are not distinct runtime systems yet, including shop-price discounts, investment cleanup, target confusion, shark overshoot, and low-energy protection.
- Break-screen kelp text always showed the base `Recover up to 5 fish` value even when kelp artifacts increased the actual recovery cap.
- Playwright MCP browser controls were not exposed in this Codex session. Direct Playwright import was blocked by a local `EPERM` path issue, and Chromium/Edge CDP did not expose a debugging port. Browser-visible checks were therefore limited to dev-server availability and code/test-backed UI verification in this pass.

## Fixes Made

- Updated artifact copy so runtime card effects match the implemented generic modifier pipeline.
- Updated the Break screen to show artifact-adjusted kelp recovery limits.
- Added regression tests for honest artifact copy and artifact-adjusted kelp recovery text.
- Added this QA report and closed the merged production-line status in `docs/PRODUCTION_LINE_PLAN.md`.

## Remaining Balance Risks

- Water disturbance remains intentionally subtle and still needs longer human playtesting for feel.
- Large-school spacing is covered by tests, but later-run readability with many recruited fish still needs a full browser smoke once Playwright MCP is available again.
- Artifact modifiers are real but intentionally broad. They should not be tuned much higher until shark pressure is manually replayed through mid-run and late-run levels.
- Risky artifacts currently pay Shell bonuses rather than adding risky combat behavior. That is acceptable for the prototype, but the card copy should stay generic until a real risk mechanic exists.

## Recommended Next Feature Pass

Run a manual browser QA pass once Playwright MCP/browser control is available, then consider a small artifact acquisition and upgrade pass. Keep it scoped to making the existing 50 artifacts easier to earn and inspect rather than adding a new artifact system.
