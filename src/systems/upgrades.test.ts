import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";
import { applyArtifactReward, applyChoice, applyLevelReward, createNewRun, rewardFlowForCompletedLevel } from "./upgrades";

describe("upgrades", () => {
  it("starts with managed fish and no active support fish", () => {
    expect(createNewRun()).toMatchObject({
      level: 1,
      fishCount: 40,
      maxFishCount: 40,
      supportCount: 0,
      fishCounts: {
        tilapia: 40,
      },
      ownedArtifacts: [],
      schoolEnergy: 100,
    });
  });

  it("adds fish without adding a faction system", () => {
    const run = applyChoice({ ...createNewRun(), level: 8 }, "tilapia");

    expect(run.fishCount).toBeGreaterThan(40);
    expect(run.maxFishCount).toBeGreaterThan(40);
    expect(run.fishCounts.tilapia).toBe(45);
    expect(run.supportCount).toBe(0);
  });

  it("recruits fast fish through adoption choices", () => {
    const parrotfish = applyChoice(createNewRun(), "parrotfish");
    const mahi = applyChoice(createNewRun(), "mahi-mahi");

    expect(parrotfish.fishCounts.parrotfish).toBe(2);
    expect(parrotfish.maxFishCount).toBe(42);
    expect(mahi.fishCounts["mahi-mahi"]).toBe(2);
  });

  it("invests 100 Shells and returns double after three completed rounds", () => {
    const invested = applyChoice({ ...createNewRun(), level: 2, currency: 150 }, "invest");
    const early = applyLevelReward(invested, createLevelConfig(3));
    const matured = applyLevelReward(early, createLevelConfig(4));

    expect(invested.currency).toBe(50);
    expect(invested.invested).toBe(100);
    expect(invested.investmentReturnLevel).toBe(4);
    expect(early.lastInvestmentReturn).toBe(0);
    expect(matured.currency).toBeGreaterThanOrEqual(200);
    expect(matured.invested).toBe(0);
    expect(matured.lastInvestmentReturn).toBe(200);
  });

  it("spends kelp to recover missing fish up to max fish count", () => {
    const run = applyChoice(
      { ...createNewRun(), currency: 140, fishCount: 29, maxFishCount: 36, fishCounts: { tilapia: 29 }, schoolEnergy: 50 },
      "heal",
    );

    expect(run.currency).toBe(40);
    expect(run.fishCount).toBe(34);
    expect(run.fishCounts.tilapia).toBe(34);
    expect(run.schoolEnergy).toBe(62);
  });

  it("lets kelp recovery artifacts restore extra missing fish", () => {
    const run = applyChoice(
      {
        ...createNewRun(),
        ownedArtifacts: ["kelp-bandage"],
        currency: 140,
        fishCount: 20,
        maxFishCount: 30,
        fishCounts: { tilapia: 20 },
        schoolEnergy: 50,
      },
      "heal",
    );

    expect(run.fishCount).toBeGreaterThan(25);
    expect(run.currency).toBe(40);
  });

  it("lets Shell economy artifacts affect real reward payouts", () => {
    const base = applyLevelReward(createNewRun(), createLevelConfig(2));
    const boosted = applyLevelReward({ ...createNewRun(), ownedArtifacts: ["pearl-cache"] }, createLevelConfig(2));

    expect(boosted.currency).toBeGreaterThan(base.currency);
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
    expect(rewardFlowForCompletedLevel(1)).toBe("recruit");
    expect(rewardFlowForCompletedLevel(2)).toBe("none");
    expect(rewardFlowForCompletedLevel(3)).toBe("artifact");
    expect(rewardFlowForCompletedLevel(5)).toBe("recruit");
    expect(rewardFlowForCompletedLevel(15)).toBe("recruit");
  });
});
