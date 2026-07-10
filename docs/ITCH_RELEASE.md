# Itch.io Release

SKOOL-A Fish Game can be packaged as an itch.io HTML5 browser game without changing the GitHub Pages build.

## Build The Itch ZIP

From the repo root:

```powershell
npm run pack:itch
```

This runs an itch-specific Vite build and creates:

```text
releases/skool-a-fish-game-itch.zip
```

Upload that ZIP to itch.io. The ZIP contains the built files from `dist` directly, with `index.html` at the root of the archive.

## Useful Commands

```powershell
npm run build:itch
npm run pack:itch
npm run preview:itch
```

- `npm run build` keeps the GitHub Pages base path: `/SKOOL-A-FISH-GAME/`.
- `npm run build:itch` uses relative paths with Vite base `./`.
- `npm run pack:itch` packages the `dist` contents into the upload ZIP.

## Recommended Itch Settings

- Kind of project/game: HTML / browser playable.
- Upload `releases/skool-a-fish-game-itch.zip`.
- Mark the uploaded file as playable in browser.
- Start the itch page in Draft.
- Test in the browser embed before publishing.
- Suggested viewport: around `1280x720`, or allow fullscreen.

## Why Itch Uses A Different Build

GitHub Pages serves this repo under:

```text
/SKOOL-A-FISH-GAME/
```

itch.io hosts HTML games inside its own page/subdirectory/iframe. Asset paths that start with `/` can fail there, so the itch build uses relative paths instead.

The itch ZIP should contain:

```text
index.html
assets/...
```

It should not contain the whole repo, and it should not wrap the game inside an extra top-level `dist/` folder.
