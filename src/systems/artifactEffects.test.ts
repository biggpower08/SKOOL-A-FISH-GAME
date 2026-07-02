import { describe, expect, it } from "vitest";
import { createNewRun } from "./upgrades";
import { buildHintForRun, getSchoolModifiers } from "./artifactEffects";

describe("artifact effect modifiers", () => {
  it("turns visible artifact build tags into gameplay modifiers", () => {
    const run = {
      ...createNewRun(),
      fishCounts: {
        tilapia: 24,
        salmon: 3,
        parrotfish: 4,
        "mahi-mahi": 3,
        grouper: 2,
      },
      ownedArtifacts: [
        "school-bell",
        "tilapia-town-charter",
        "parrotfish-mood-ring",
        "grouper-hard-hat",
        "mahi-sprint-sticker",
        "salmon-lane-pass",
        "pearl-cache",
        "kelp-bandage",
        "bubble-net",
        "tiny-reef-lawyer",
      ],
    };

    const modifiers = getSchoolModifiers(run);

    expect(modifiers.speedMultiplierByType.parrotfish).toBeGreaterThan(1);
    expect(modifiers.speedMultiplierByType["mahi-mahi"]).toBeGreaterThan(1);
    expect(modifiers.healthBonusByType.grouper).toBeGreaterThan(0);
    expect(modifiers.healthBonusByType.salmon).toBeGreaterThan(0);
    expect(modifiers.evasionBonusByType.parrotfish).toBeGreaterThan(0);
    expect(modifiers.catchResistance).toBeGreaterThan(0);
    expect(modifiers.shellRewardMultiplier).toBeGreaterThan(1);
    expect(modifiers.kelpRestoreBonus).toBeGreaterThan(0);
    expect(modifiers.sharkHungerDrainMultiplier).toBeGreaterThan(1);
    expect(modifiers.sharkSpeedMultiplier).toBeLessThan(1);
    expect(modifiers.riskyShellBonus).toBeGreaterThan(0);
    expect(modifiers.recruitBonusByType.tilapia).toBeGreaterThan(0);
  });

  it("summarizes the current build without adding UI clutter", () => {
    const run = {
      ...createNewRun(),
      ownedArtifacts: ["parrotfish-mood-ring", "bubble-net"],
      fishCounts: {
        tilapia: 12,
        parrotfish: 5,
      },
    };

    expect(buildHintForRun(run)).toBe("Parrotfish dodge");
  });
});
