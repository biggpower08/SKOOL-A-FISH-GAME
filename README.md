# SKOOL-A Fish Game

A browser-based fish-school survival autobattler roguelite.

Guide a school of fish through ocean chaos while named sharks pressure the group in different ways. Survive levels, recruit new fish, collect artifacts, manage Shells, and keep the school alive as long as possible.

Live game: https://biggpower08.github.io/SKOOL-A-FISH-GAME/

## Current Version

This is a playable prototype focused on:

* fish-school flocking
* shark pressure and hunger behavior
* named shark identities
* recruit choices
* artifact collection
* Shell economy
* level progression
* pause, home, save, and end-run flow
* compact in-game UI
* Canvas-based ocean visuals

## Game Modes

### Player Mode

Player Mode is the intended public game experience.

It keeps debug tools hidden and presents the game as a normal playable browser game.

### Dev Mode

Dev Mode is for testing and balancing.

Depending on the current build, Dev Mode may expose tools such as:

* level jumping
* recruit testing
* artifact toggling
* debug purchase behavior

Dev Mode should stay separate from the player-facing experience.

## Shark Identities

Current shark roles:

* Norman: baseline closest-fish hunter
* Steezy: faster closest-fish hunter
* Grog: center-school disruptor
* Bill: isolated-fish hunter
* Eel: late/special shark placeholder

## Commands

```bash
npm install
npm run dev
npm run build
npm test
```

## Development

This project uses Vite, TypeScript, and Canvas.

The game is designed to stay lightweight and GitHub Pages-friendly. Avoid adding large frameworks or major systems unless they clearly improve the core game.

Codex MCP usage for this repo is documented in:

```text
docs/MCP_WORKFLOW.md
```

Use it for Playwright browser checks, Context7 documentation lookup, Sequential Thinking planning, and notes about unavailable MCP servers.

## Deployment

The repo includes a GitHub Actions workflow at:

```text
.github/workflows/static.yml
```

Set the repository Pages source to GitHub Actions. Pushes to `main` will build and deploy `dist`.

The Vite base path is currently set for:

```text
biggpower08/SKOOL-A-FISH-GAME
```

## Itch.io Build

Use the itch build when uploading SKOOL-A as an HTML5 browser game:

```bash
npm run build:itch
npm run pack:itch
```

The upload ZIP is created at:

```text
releases/skool-a-fish-game-itch.zip
```

See `docs/ITCH_RELEASE.md` for itch.io upload settings and why this build uses relative asset paths.

## Finished-for-now Scope

This version should focus on polish, stability, and readability before adding new content.

Do not add new fish, artifacts, currencies, boss systems, or large progression systems until the current version feels stable and playable.
