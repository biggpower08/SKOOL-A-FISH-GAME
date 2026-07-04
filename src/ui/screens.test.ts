import { describe, expect, it } from "vitest";
import screensSource from "./screens.ts?raw";

describe("intermission screens", () => {
  it("uses cleaned UI icons for break and artifact choices", () => {
    expect(screensSource).toContain("uiIconAssets.kelp");
    expect(screensSource).toContain("uiIconAssets.shell");
    expect(screensSource).toContain("uiIconAssets.treasureChest");
    expect(screensSource).not.toContain('marker("artifact-card-marker", "S")');
    expect(screensSource).not.toContain('marker("artifact-card-marker", ">")');
  });
});
