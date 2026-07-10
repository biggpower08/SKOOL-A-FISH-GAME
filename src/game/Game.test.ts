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

  it("keeps player artifacts read-only and dev artifacts toggleable", () => {
    expect(gameSource).toContain('this.mode === "dev"');
    expect(gameSource).toContain("Click to add debug artifact");
    expect(gameSource).toContain("Owned artifact");
    expect(gameSource).toContain("if (!this.run || this.mode !== \"dev\")");
  });
});

describe("Game mode routing", () => {
  it("uses Settings as the Dev Mode entry point and hides dev controls from Home", () => {
    expect(gameSource).toContain("private showSettings()");
    expect(gameSource).toContain("renderSettings(this.overlay");
    expect(gameSource).toContain('onPlay: () => this.newCampaign("player")');
    expect(gameSource).toContain('onDevMode: () => this.newCampaign("dev")');
    expect(gameSource).toContain("this.hideDevLevelScroller()");
  });

  it("keeps dev controls and cheats behind dev mode", () => {
    expect(gameSource).toContain('if (this.mode !== "dev")');
    expect(gameSource).toContain('this.canvas.dataset.mode = this.mode');
    expect(gameSource).toContain('isDevMode: this.mode === "dev"');
    expect(gameSource).toContain("freePurchases: this.mode === \"dev\" && DEV_FREE_PURCHASES");
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
    expect(gameSource).toContain("this.canvas.dataset.kelpState");
    expect(gameSource).toContain("this.canvas.dataset.kelpProgress");
    expect(gameSource).toContain("this.canvas.dataset.behaviorModes");
    expect(gameSource).toContain("feedableKelp.pos.x - center.x");
  });

  it("keeps consumed kelp out of forage steering until it respawns", () => {
    expect(gameSource).toContain("private feedableKelpGoal()");
    expect(gameSource).toContain("kelpGoal: this.feedableKelpGoal()");
    expect(gameSource).toContain("advanceKelpFeeding");
    expect(gameSource).toContain("fadeConsumedKelp");
  });
});
