import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";
import { applyChoice, applyLevelReward, createNewRun } from "./upgrades";

describe("upgrades", () => {
  it("starts with managed fish and one support fish", () => {
    expect(createNewRun()).toMatchObject({
      level: 1,
      fishCount: 32,
      supportCount: 1,
      schoolEnergy: 100,
    });
  });

  it("adds fish without adding a faction system", () => {
    const run = applyChoice({ ...createNewRun(), level: 8 }, "fish");

    expect(run.fishCount).toBeGreaterThan(32);
    expect(run.supportCount).toBe(2);
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
    const run = applyChoice({ ...createNewRun(), currency: 6, schoolEnergy: 50 }, "shop");

    expect(run.currency).toBe(1);
    expect(run.fishCount).toBe(34);
    expect(run.schoolEnergy).toBe(84);
  });
});
