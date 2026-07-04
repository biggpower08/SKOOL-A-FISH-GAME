import { describe, expect, it } from "vitest";
import gameSource from "./Game.ts?raw";

describe("Game artifact UI", () => {
  it("uses the cleaned treasure chest asset for artifact access", () => {
    expect(gameSource).toContain("uiIconAssets.treasureChest");
    expect(gameSource).not.toContain('this.artifactButton.textContent = "A"');
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
    expect(gameSource).toContain("this.kelpGoal.pos.x - center.x");
  });
});
