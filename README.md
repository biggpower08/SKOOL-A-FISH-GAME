# SKOOL-A Fish Game

GitHub Pages-ready prototype for a fish-school autobattler roguelite.

Current discipline: circles first, black background first, flocking first.

Live target: https://biggpower08.github.io/SKOOL-A-FISH-GAME/

Current prototype includes flocking fish, hunger-based shark starvation, level
path preview, enemy composition HUD, placeholder shark types, and subtle Canvas
water ripples.

## Commands

```bash
npm install
npm run dev
npm run build
npm test
```

The Vite base path is set for `biggpower08/SKOOL-A-FISH-GAME`.

## Deployment

The repo includes a GitHub Actions workflow at `.github/workflows/static.yml`.
Set repository Pages source to GitHub Actions, then pushes to `main` will build and deploy `dist`.
