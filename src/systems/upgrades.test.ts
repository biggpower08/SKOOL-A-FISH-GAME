import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";
import {
  ARTIFACT_EXHAUSTION_SHELL_BONUS,
  applyArtifactExhaustionFallback,
  applyArtifactReward,
  applyChoice,
  applyLevelReward,
  applyRoundRecovery,
  createNewRun,
  hasArtifactChoicesRemaining,
  rewardFlowForCompletedLevel,
} from "./upgrades";
import { artifactDefinitions } from "./artifacts";

describe("upgrades", () => {
  it("starts with managed fish and no active support fish", () => {
    expect(createNewRun()).toMatchObject({
      level: 1,
      fishCount: 54,
      maxFishCount: 54,
      supportCount: 0,
      fishCounts: {
        tilapia: 54,
      },
      ownedArtifacts: [],
      schoolEnergy: 100,
    });
  });

  it("adds fish without adding a faction system", () => {
    const run = applyChoice({ ...createNewRun(), level: 8 }, "tilapia");

    expect(run.fishCount).toBeGreaterThan(54);
    expect(run.maxFishCount).toBeGreaterThan(54);
    expect(run.fishCounts.tilapia).toBe(62);
    expect(run.supportCount).toBe(0);
  });

  it("recruits fast fish through adoption choices", () => {
    const parrotfish = applyChoice({ ...createNewRun(), currency: 90 }, "parrotfish");
    const mahi = applyChoice({ ...createNewRun(), currency: 90 }, "mahi-mahi");

    expect(parrotfish.fishCounts.parrotfish).toBe(4);
    expect(parrotfish.currency).toBe(20);
    expect(parrotfish.maxFishCount).toBe(58);
    expect(mahi.fishCounts["mahi-mahi"]).toBe(4);
  });

  it("locks Shell-gated recruits without spending below zero", () => {
    const run = applyChoice(createNewRun(), "parrotfish");

    expect(run.currency).toBe(0);
    expect(run.fishCount).toBe(54);
    expect(run.fishCounts.parrotfish ?? 0).toBe(0);
    expect(run.lastRecruitmentSummary).toBe("Not enough Shells");
  });

  it("buys mixed fish bundles with Shells and updates school capacity", () => {
    const run = applyChoice({ ...createNewRun(), currency: 130, lastRecoverySummary: "Recovered 2 fish after the wave" }, "grouper");

    expect(run.currency).toBe(20);
    expect(run.fishCount).toBe(59);
    expect(run.maxFishCount).toBe(59);
    expect(run.fishCounts.grouper).toBe(2);
    expect(run.fishCounts.salmon).toBe(3);
    expect(run.lastRecruitmentSummary).toBe("School grew! +2 Grouper, +3 Salmon");
    expect(run.lastRecoverySummary).toBe("");
  });

  it("allows dev-mode recruitment bypass without negative Shells", () => {
    const run = applyChoice({ ...createNewRun(), currency: 0 }, "grouper", { freePurchases: true });

    expect(run.currency).toBe(0);
    expect(run.fishCount).toBe(59);
    expect(run.fishCounts.grouper).toBe(2);
    expect(run.lastRecruitmentSummary).toBe("School grew! +2 Grouper, +3 Salmon");
  });

  it("uses level-varying recruitment bundles during application", () => {
    const run = applyChoice({ ...createNewRun(), level: 12, currency: 150 }, "parrotfish");

    expect(run.fishCounts.parrotfish).toBe(4);
    expect(run.fishCounts.tilapia).toBe(57);
    expect(run.fishCount).toBe(61);
    expect(run.currency).toBe(16);
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

  it("automatically recovers dead fish from multiple recruited types after a round", () => {
    const run = applyRoundRecovery(
      {
        ...createNewRun(),
        fishCount: 10,
        maxFishCount: 20,
        fishCounts: {
          tilapia: 4,
          salmon: 2,
          parrotfish: 2,
          "mahi-mahi": 1,
          grouper: 1,
        },
        lastRecruitmentSummary: "School grew! +4 Parrotfish",
      },
      {
        tilapia: 6,
        salmon: 3,
        parrotfish: 2,
        "mahi-mahi": 2,
        grouper: 1,
      },
    );

    expect(run.fishCount).toBe(13);
    expect(run.maxFishCount).toBe(20);
    expect(run.fishCounts.salmon).toBe(3);
    expect(run.fishCounts["mahi-mahi"]).toBe(2);
    expect(run.fishCounts.tilapia).toBe(5);
    expect(run.lostFishCounts).toMatchObject({
      tilapia: 5,
      salmon: 2,
      parrotfish: 2,
      "mahi-mahi": 1,
      grouper: 1,
    });
    expect(run.lastRecoverySummary).toBe("Recovered 3 fish after the wave: +1 Tilapia, +1 Salmon, +1 Mahi-Mahi");
    expect(run.lastRecruitmentSummary).toBe("");
  });

  it.each(["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"] as const)("can recover dead %s from the saved dead pool", (typeId) => {
    const liveCounts = typeId === "tilapia" ? { tilapia: 1 } : { tilapia: 1, [typeId]: 0 };
    const run = applyRoundRecovery(
      {
        ...createNewRun(),
        fishCount: 1,
        maxFishCount: 4,
        fishCounts: liveCounts,
      },
      {
        [typeId]: 3,
      },
    );

    expect(run.fishCounts[typeId]).toBe(typeId === "tilapia" ? 2 : 1);
    expect(run.fishCount).toBe(2);
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

  it("detects artifact exhaustion and grants fallback Shells", () => {
    const allArtifacts = artifactDefinitions.map((artifact) => artifact.id);
    const exhausted = { ...createNewRun(), currency: 40, ownedArtifacts: allArtifacts };

    expect(hasArtifactChoicesRemaining(exhausted)).toBe(false);

    const fallback = applyArtifactExhaustionFallback(exhausted);

    expect(fallback.currency).toBe(40 + ARTIFACT_EXHAUSTION_SHELL_BONUS);
    expect(fallback.ownedArtifacts).toEqual(allArtifacts);
    expect(fallback.lastRecruitmentSummary).toBe(`All artifacts collected: +${ARTIFACT_EXHAUSTION_SHELL_BONUS} Shells`);
  });

  it("alternates reward popups by completed level interval", () => {
    expect(rewardFlowForCompletedLevel(1)).toBe("recruit");
    expect(rewardFlowForCompletedLevel(2)).toBe("none");
    expect(rewardFlowForCompletedLevel(3)).toBe("artifact");
    expect(rewardFlowForCompletedLevel(5)).toBe("recruit");
    expect(rewardFlowForCompletedLevel(15)).toBe("recruit");
  });
});
