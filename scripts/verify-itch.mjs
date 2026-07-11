import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const distDir = "dist";
const releaseZip = join("releases", "skool-a-fish-game-itch.zip");
const pagesBase = "/SKOOL-A-FISH-GAME/";
const windowsPathPattern = /[A-Za-z]:\\/;
const fileUrlPattern = /file:\/\//i;

const fail = (message) => {
  console.error(`itch verification failed: ${message}`);
  process.exit(1);
};

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
};

const assertNoForbiddenPaths = (label, text) => {
  if (text.includes(pagesBase)) {
    fail(`${label} contains the GitHub Pages base path ${pagesBase}`);
  }

  if (windowsPathPattern.test(text) || fileUrlPattern.test(text)) {
    fail(`${label} contains a local file path`);
  }
};

const main = async () => {
  const indexPath = join(distDir, "index.html");

  if (!(await exists(indexPath))) {
    fail("dist/index.html is missing. Run npm run build:itch first.");
  }

  const indexHtml = await readFile(indexPath, "utf8");
  assertNoForbiddenPaths("dist/index.html", indexHtml);

  if (/src="\/|href="\//.test(indexHtml)) {
    fail("dist/index.html references root-absolute assets; itch needs ./ relative paths.");
  }

  const assetRefs = [...indexHtml.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((match) => match[1]);

  if (assetRefs.length === 0) {
    fail("dist/index.html does not reference ./assets/ files.");
  }

  for (const ref of assetRefs) {
    const assetPath = join(distDir, ref.replace(/^\.\//, ""));

    if (!(await exists(assetPath))) {
      fail(`dist/index.html references missing asset ${ref}`);
    }
  }

  const textAssets = (await collectFiles(distDir)).filter((file) => /\.(html|css|js|json|svg)$/i.test(file));

  for (const file of textAssets) {
    assertNoForbiddenPaths(file, await readFile(file, "utf8"));
  }

  if (!(await exists(releaseZip))) {
    fail(`${releaseZip} is missing. Run npm run pack:itch first.`);
  }

  const zipBuffer = await readFile(releaseZip);
  const zipText = zipBuffer.toString("latin1");

  if (zipText.includes(pagesBase)) {
    fail(`${releaseZip} contains the GitHub Pages base path ${pagesBase}`);
  }

  if (fileUrlPattern.test(zipText)) {
    fail(`${releaseZip} contains a file:// URL`);
  }

  if (!zipText.includes("index.html")) {
    fail("itch ZIP does not contain index.html at the archive root.");
  }

  if (!zipText.includes("assets/")) {
    fail("itch ZIP does not contain assets/ entries.");
  }

  if (zipText.includes("dist/index.html") || zipText.includes("dist/assets/")) {
    fail("itch ZIP wraps files inside dist/; index.html must be at the archive root.");
  }

  console.log("itch verification passed: relative paths, root index.html, assets present, no local paths.");
};

main().catch((error) => fail(error.message));
