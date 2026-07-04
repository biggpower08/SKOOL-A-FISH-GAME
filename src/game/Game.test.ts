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

describe("Game loss conditions", () => {
  it("does not end the run just because school energy reaches zero", () => {
    expect(gameSource).toContain("if (!hasLivingSchoolFish(this.fish))");
    expect(gameSource).not.toContain("|| this.run.schoolEnergy <= 0");
  });
});

describe("Game kelp goals", () => {
  it("tracks and renders an interior kelp goal during combat", () => {
    expect(gameSource).toContain("kelpGoalPosition");
    expect(gameSource).toContain("this.canvas.dataset.kelpGoal");
    expect(gameSource).toContain("this.canvas.dataset.behaviorModes");
    expect(gameSource).toContain("this.kelpGoal.pos.x - center.x");
  });
});
