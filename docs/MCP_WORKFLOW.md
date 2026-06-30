# Codex MCP Workflow

This repo is a Vite + TypeScript + Canvas game prototype deployed to GitHub
Pages. Use MCP servers to improve development, testing, and research only when
they help the current task. Ponytail discipline still wins: make the smallest
correct change and keep the game playable.

## Detected MCP Servers

Checked with:

```powershell
codex mcp list
```

Detected in this Codex setup:

- `playwright` - enabled
- `context7` - enabled
- `sequential-thinking` - enabled
- `github` - enabled
- `exa` - enabled
- `memory` - enabled
- `node_repl` - enabled

Requested but not detected:

- `perplexity`
- `firecrawl`

If Perplexity or Firecrawl are added later, re-run `codex mcp list` and update
this file before relying on them.

## Project Use

### Playwright

Use Playwright for browser-visible behavior:

- home screen load checks
- New Campaign and Continue Campaign flows
- pause, Home, End Run, and between-round intermission flows
- artifact panel and hidden artifact visual checks
- console errors, navigation bugs, and layout issues
- Canvas smoke checks when gameplay/rendering changes

Do not use Playwright to replace unit tests for pure game logic. Keep browser
checks focused on the most important flows.

### Context7

Use Context7 when current documentation matters for this stack:

- Vite config, build, preview, and static deploy behavior
- Vitest coverage/test configuration
- TypeScript or dependency API questions
- library or framework upgrade decisions

Do not use Context7 for private repo content or ordinary game-design judgment.
Record any documentation-driven decisions in the implementation summary or a
project note when they affect the workflow.

### Sequential Thinking

Use Sequential Thinking before non-trivial work:

- multi-file gameplay changes
- debugging edge/corner behavior
- save-state migrations
- architecture or refactor decisions
- test strategy decisions

Keep the plan short and tied to actual repo files. Do not turn planning into a
large design document when a small patch is enough.

### Perplexity

Perplexity was not connected when this file was written. If connected later, use
it only for up-to-date public research such as deployment issues, package/tooling
changes, or technical comparisons. Do not send private repo content to it.

### Firecrawl

Firecrawl was not connected when this file was written. If connected later, use
it for structured extraction from public documentation pages when that is more
useful than a normal docs lookup. Do not crawl random sites or use it for private
project content.

## Normal Commands

Install dependencies:

```powershell
npm install
```

Run the dev server:

```powershell
npm run dev
```

Run tests:

```powershell
npm test
```

Run coverage:

```powershell
npm run test:coverage
```

Build for GitHub Pages:

```powershell
npm run build
```

Audit dependencies:

```powershell
npm audit --audit-level=moderate
```

## Verification Standard

For docs-only workflow changes, run at least:

```powershell
npm test
npm run build
```

For gameplay, rendering, UI, save, or balance changes, run:

```powershell
npm test
npm run build
npm run test:coverage
npm audit --audit-level=moderate
```

Then do a focused browser smoke test with Playwright or the Codex browser when
the change affects UI, Canvas rendering, controls, or gameplay flow.

Minimum browser smoke for this game:

- home screen loads
- New Campaign starts
- Canvas renders fish and sharks
- break/intermission appears after a completed round when practical
- artifact panel opens
- pause menu opens with `Esc`
- Home and End Run remain available from menus

## Deployment Notes

This repo deploys with GitHub Actions from `.github/workflows/static.yml`.
Pushes to `main` run `npm ci`, `npm test`, and `npm run build`, then deploy
`dist` to GitHub Pages.

Do not claim the live GitHub Pages site is updated unless the deployment was
checked after the push.
