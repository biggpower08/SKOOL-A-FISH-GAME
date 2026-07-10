import { describe, expect, it } from "vitest";
import screensSource from "./screens.ts?raw";

describe("intermission screens", () => {
  it("keeps Dev Mode behind Settings instead of on the home menu", () => {
    expect(screensSource).toContain("export const renderSettings");
    expect(screensSource).toContain('button("New Game"');
    expect(screensSource).toContain('button("Settings"');
    expect(screensSource).toContain('button("Dev Mode"');
    expect(screensSource.indexOf("export const renderSettings")).toBeLessThan(screensSource.indexOf('button("Dev Mode"'));
    expect(screensSource).not.toContain('button("Continue Dev"');
    expect(screensSource).not.toContain('button("Player Mode"');
  });

  it("makes reward choices explicitly mode-aware", () => {
    expect(screensSource).toContain("isDevMode: boolean");
    expect(screensSource).toContain("handlers.isDevMode && DEV_FREE_PURCHASES");
  });

  it("uses cleaned UI icons for break and artifact choices", () => {
    expect(screensSource).toContain("uiIconAssets.kelp");
    expect(screensSource).toContain("uiIconAssets.shell");
    expect(screensSource).toContain("uiIconAssets.treasureChest");
    expect(screensSource).not.toContain('marker("artifact-card-marker", "S")');
    expect(screensSource).not.toContain('marker("artifact-card-marker", ">")');
  });
});
