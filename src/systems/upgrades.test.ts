import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";
import { applyArtifactReward, applyChoice, applyLevelReward, createNewRun, rewardFlowForCompletedLevel } from "./upgrades";

describe("upgrades", () => {
  it("starts with managed fish and one support fish", () => {
    expect(createNewRun()).toMatchObject({
      level: 1,
      fishCount: 36,
      supportCount: 1,
      fishCounts: {
        tilapia: 36,
      },
      ownedArtifacts: [],
      schoolEnergy: 100,
    });
  });

  it("adds fish without adding a faction system", () => {
    const run = applyChoice({ ...createNewRun(), level: 8 }, "tilapia");

    expect(run.fishCount).toBeGreaterThan(36);
    expect(run.fishCounts.tilapia).toBe(41);
    expect(run.supportCount).toBe(1);
  });

  it("recruits support fish through recruitment choices", () => {
    const run = applyChoice({ ...createNewRun(), level: 8 }, "support");

    expect(run.fishCount).toBe(36);
    expect(run.supportCount).toBe(2);
  });

  it("recruits fast fish through adoption choices", () => {
    const parrotfish = applyChoice(createNewRun(), "parrotfish");
    const mahi = applyChoice(createNewRun(), "mahi-mahi");

    expect(parrotfish.fishCounts.parrotfish).toBe(2);
    expect(mahi.fishCounts["mahi-mahi"]).toBe(2);
  });

  it("supports investment and later returns", () => {
    const invested = applyChoice({ ...createNewRun(), currency: 20 }, "invest");
    const rewarded = applyLevelReward(invested, createLevelConfig(5));

    expect(invested.currency).toBeLessThan(20);
    expect(invested.invested).toBeGreaterThan(0);
    expect(rewarded.currency).toBeGreaterThan(invested.currency);
    expect(rewarded.invested).toBeLessThan(invested.invested);
  });

  it("lets the shop replenish school energy", () => {
    const run = applyChoice({ ...createNewRun(), currency: 6, fishCount: 12, schoolEnergy: 50 }, "heal");

    expect(run.currency).toBe(1);
    expect(run.fishCount).toBe(12);
    expect(run.schoolEnergy).toBe(84);
  });

  it("spends currency on a placeholder artifact without adding fish", () => {
    const run = applyChoice({ ...createNewRun(), currency: 12, fishCount: 10 }, "artifact");

    expect(run.currency).toBe(4);
    expect(run.fishCount).toBe(10);
  });

  it("awards owned artifacts once", () => {
    const first = applyArtifactReward(createNewRun(), "bubble-net");
    const second = applyArtifactReward(first, "bubble-net");

    expect(first.ownedArtifacts).toEqual(["bubble-net"]);
    expect(second.ownedArtifacts).toEqual(["bubble-net"]);
  });

  it("alternates reward popups by completed level interval", () => {
    expect(rewardFlowForCompletedLevel(1)).toBe("none");
    expect(rewardFlowForCompletedLevel(3)).toBe("artifact");
    expect(rewardFlowForCompletedLevel(5)).toBe("recruit");
    expect(rewardFlowForCompletedLevel(15)).toBe("recruit");
  });
});
