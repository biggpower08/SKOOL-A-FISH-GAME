import type { ArtifactId, ChoiceId, FishTypeId, LevelConfig, RewardFlow, RunState } from "../game/types";
import { defaultFishCounts } from "./fishTypes";
import { clamp } from "./vector";

export const STARTING_FISH_COUNT = 40;
const KELP_COST = 100;
const KELP_RESTORE_COUNT = 5;
const INVESTMENT_AMOUNT = 100;
const INVESTMENT_RETURN_ROUNDS = 3;
const ACTIVE_RECRUIT_TYPES = new Set<FishTypeId>(["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"]);

export const createNewRun = (): RunState => ({
  level: 1,
  fishCount: STARTING_FISH_COUNT,
  maxFishCount: STARTING_FISH_COUNT,
  supportCount: 0,
  fishCounts: defaultFishCounts(),
  ownedArtifacts: [],
  currency: 0,
  invested: 0,
  investmentReturnLevel: null,
  lastInvestmentReturn: 0,
  schoolEnergy: 100,
  bestLevel: 1,
});

export const rewardFlowForCompletedLevel = (level: number): RewardFlow => {
  if (level > 0 && level % 5 === 0) {
    return "recruit";
  }

  if (level > 0 && level % 3 === 0) {
    return "artifact";
  }

  return "none";
};

export const applyLevelReward = (run: RunState, config: LevelConfig): RunState => {
  const returnedInvestment =
    run.invested > 0 && run.investmentReturnLevel !== null && config.level >= run.investmentReturnLevel ? run.invested * 2 : 0;

  return {
    ...run,
    currency: run.currency + config.rewardCurrency + returnedInvestment,
    invested: returnedInvestment > 0 ? 0 : run.invested,
    investmentReturnLevel: returnedInvestment > 0 ? null : run.investmentReturnLevel,
    lastInvestmentReturn: returnedInvestment,
    bestLevel: Math.max(run.bestLevel, config.level),
  };
};

export const applyChoice = (run: RunState, choice: ChoiceId): RunState => {
  const fishToAdd =
    choice === "tilapia"
      ? 5
      : choice === "salmon"
        ? 3
        : choice === "parrotfish" || choice === "mahi-mahi"
          ? 2
          : choice === "grouper"
            ? 1
            : 0;

  if (fishToAdd) {
    const fishChoice = choice as "tilapia" | "salmon" | "parrotfish" | "mahi-mahi" | "grouper";

    return {
      ...run,
      fishCount: run.fishCount + fishToAdd,
      maxFishCount: Math.max(run.maxFishCount, run.fishCount + fishToAdd),
      fishCounts: {
        ...run.fishCounts,
        [fishChoice]: (run.fishCounts[fishChoice] ?? 0) + fishToAdd,
      },
    };
  }

  if (choice === "support") {
    return run;
  }

  if (choice === "invest") {
    if (run.currency < INVESTMENT_AMOUNT || run.invested > 0) {
      return run;
    }

    return {
      ...run,
      currency: run.currency - INVESTMENT_AMOUNT,
      invested: INVESTMENT_AMOUNT,
      investmentReturnLevel: run.level + INVESTMENT_RETURN_ROUNDS - 1,
      lastInvestmentReturn: 0,
    };
  }

  if (choice === "artifact") {
    return {
      ...run,
      currency: Math.max(0, run.currency - 8),
    };
  }

  const missing = Math.max(0, run.maxFishCount - run.fishCount);
  const restored = run.currency >= KELP_COST ? Math.min(KELP_RESTORE_COUNT, missing) : 0;
  const fishCounts =
    restored > 0
      ? {
          ...run.fishCounts,
          tilapia: (run.fishCounts.tilapia ?? 0) + restored,
        }
      : run.fishCounts;

  return {
    ...run,
    currency: restored > 0 ? run.currency - KELP_COST : run.currency,
    fishCount: run.fishCount + restored,
    fishCounts,
    schoolEnergy: clamp(run.schoolEnergy + (restored > 0 ? 12 : 0), 0, 110),
  };
};

export const applyArtifactReward = (run: RunState, artifactId: ArtifactId): RunState => {
  if (run.ownedArtifacts.includes(artifactId)) {
    return run;
  }

  return {
    ...run,
    ownedArtifacts: [...run.ownedArtifacts, artifactId],
  };
};

export const normalizeRun = (run: RunState): RunState => {
  const legacySupport = run.fishCounts.support ?? 0;
  const activeFishCounts = Object.fromEntries(
    Object.entries(run.fishCounts).filter(([typeId]) => ACTIVE_RECRUIT_TYPES.has(typeId as FishTypeId)),
  ) as RunState["fishCounts"];
  const fishCount = Object.values(activeFishCounts).reduce((sum, count) => sum + (count ?? 0), 0) || run.fishCount;
  const convertedFishCounts = legacySupport > 0
    ? {
        ...activeFishCounts,
        salmon: (activeFishCounts.salmon ?? 0) + legacySupport,
      }
    : activeFishCounts;
  const convertedFishCount = fishCount + legacySupport;

  return {
    ...run,
    fishCount: convertedFishCount,
    maxFishCount: Math.max(run.maxFishCount ?? convertedFishCount, convertedFishCount),
    supportCount: 0,
    fishCounts: convertedFishCounts,
    investmentReturnLevel: run.investmentReturnLevel ?? null,
    lastInvestmentReturn: run.lastInvestmentReturn ?? 0,
  };
};
