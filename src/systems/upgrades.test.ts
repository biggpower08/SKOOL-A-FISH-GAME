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
    const run = applyChoice({ ...createNewRun(), level: 8 }, "tilapia");

    expect(run.fishCount).toBeGreaterThan(32);
    expect(run.supportCount).toBe(1);
  });

  it("recruits support fish through recruitment choices", () => {
    const run = applyChoice({ ...createNewRun(), level: 8 }, "support");

    expect(run.fishCount).toBe(32);
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
});
