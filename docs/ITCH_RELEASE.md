# Itch.io Release

SKOOL-A Fish Game can be packaged as an itch.io HTML5 browser game without changing the GitHub Pages build.

## Build The Itch ZIP

From the repo root:

```powershell
npm run pack:itch
npm run verify:itch
```

This runs an itch-specific Vite build and creates:

```text
releases/skool-a-fish-game-itch.zip
```

Upload that ZIP to itch.io. The ZIP contains the built files from `dist` directly, with `index.html` at the root of the archive.

Run `npm run verify:itch` after packaging. It checks that the itch build uses relative asset paths, that the GitHub Pages base path did not leak into the itch build, that `index.html` is present at the ZIP root, and that obvious asset references exist.

## Useful Commands

```powershell
npm run build:itch
npm run pack:itch
npm run verify:itch
npm run preview:itch
```

- `npm run build` keeps the GitHub Pages base path: `/SKOOL-A-FISH-GAME/`.
- `npm run build:itch` uses relative paths with Vite base `./`.
- `npm run pack:itch` packages the `dist` contents into the upload ZIP.
- `npm run verify:itch` checks the generated `dist` and ZIP for release-breaking path mistakes.

## Recommended Itch Settings

- Kind of project/game: HTML / browser playable.
- Upload `releases/skool-a-fish-game-itch.zip`.
- Mark the uploaded file as playable in browser.
- Enable fullscreen.
- Start the itch page in Draft.
- Test in the browser embed before publishing.
- Suggested viewport: around `1280x720`, or allow fullscreen.
- If you mention mobile support on the itch page, recommend landscape mode for more play space.

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

## Mobile Support Notes

The game scales the canvas to the current browser or itch iframe viewport. Menus use tappable buttons and can scroll on small screens. During combat, players can tap or drag inside the play area to guide the school and use the round pause button without a keyboard.

Phone portrait is supported for basic play, but landscape fullscreen is the preferred mobile layout because it leaves more room for the school and HUD.

## Release Smoke Checklist

- Windows Chrome: open local preview or itch Draft, start New Game, confirm sprites/assets load.
- Windows Edge: repeat start, pause, artifact panel, and one between-round choice.
- Mac/Safari if available: confirm `index.html` loads from itch Draft with no broken assets.
- iPhone Safari: test portrait and landscape; menus should not clip, and tap/drag should guide the school.
- Android Chrome: test portrait and landscape; page should not scroll while playing.
- itch Draft iframe: upload `releases/skool-a-fish-game-itch.zip`, launch in page embed, confirm no `/SKOOL-A-FISH-GAME/` asset failures.
- itch fullscreen mode: confirm canvas fills the viewport and touch controls still work.
