# SKOOL-A Fish Game

GitHub Pages-ready prototype for a fish-school autobattler roguelite.

Current discipline: circles first, dark aquatic background first, flocking first.

Live target: https://biggpower08.github.io/SKOOL-A-FISH-GAME/

Current prototype includes flocking fish, hunger-based shark starvation, level
path preview, compact fish type health UI, enemy composition HUD, placeholder
shark types, Shells, recruitment nodes, an artifact edge placeholder, pause/home/end-run
flow, and subtle Canvas water shading.

## Commands

```bash
npm install
npm run dev
npm run build
npm test
```

The Vite base path is set for `biggpower08/SKOOL-A-FISH-GAME`.

## Development Workflow

Codex MCP usage for this repo is documented in
[`docs/MCP_WORKFLOW.md`](docs/MCP_WORKFLOW.md). Use it for Playwright browser
checks, Context7 documentation lookup, Sequential Thinking planning, and notes
about unavailable MCP servers.

## Deployment

The repo includes a GitHub Actions workflow at `.github/workflows/static.yml`.
Set repository Pages source to GitHub Actions, then pushes to `main` will build and deploy `dist`.
