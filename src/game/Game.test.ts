import { describe, expect, it } from "vitest";
import gameSource from "./Game.ts?raw";

describe("Game artifact UI", () => {
  it("uses the cleaned treasure chest asset for artifact access", () => {
    expect(gameSource).toContain("uiIconAssets.treasureChest");
    expect(gameSource).not.toContain('this.artifactButton.textContent = "A"');
  });

  it("keeps placeholder glyphs out of artifact card image fallbacks", () => {
    expect(gameSource).not.toContain("artifactIconGlyphs");
    expect(gameSource).not.toContain('tooth: "V"');
    expect(gameSource).not.toContain('coupon: "%"');
    expect(gameSource).toContain('iconImage.alt = `${artifact.name} artifact`');
  });
});
