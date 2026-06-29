import type { ArtifactId, ChoiceId, LevelConfig, RewardFlow, RunState } from "../game/types";
import { defaultFishCounts } from "./fishTypes";
import { clamp } from "./vector";

export const STARTING_FISH_COUNT = 36;

export const createNewRun = (): RunState => ({
  level: 1,
  fishCount: STARTING_FISH_COUNT,
  supportCount: 1,
  fishCounts: defaultFishCounts(),
  ownedArtifacts: [],
  currency: 0,
  invested: 0,
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
  const returnedInvestment = config.level % 5 === 0 ? Math.ceil(run.invested * 0.28) : 0;

  return {
    ...run,
    currency: run.currency + config.rewardCurrency + returnedInvestment,
    invested: Math.max(0, run.invested - returnedInvestment),
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
      fishCounts: {
        ...run.fishCounts,
        [fishChoice]: (run.fishCounts[fishChoice] ?? 0) + fishToAdd,
      },
    };
  }

  if (choice === "support") {
    return {
      ...run,
      supportCount: Math.min(5, run.supportCount + 1),
    };
  }

  if (choice === "invest") {
    const amount = Math.min(run.currency, Math.max(4, Math.floor(run.currency * 0.45)));

    return {
      ...run,
      currency: run.currency - amount,
      invested: run.invested + amount + 2,
    };
  }

  if (choice === "artifact") {
    return {
      ...run,
      currency: Math.max(0, run.currency - 8),
    };
  }

  return {
    ...run,
    currency: Math.max(0, run.currency - 5),
    schoolEnergy: clamp(run.schoolEnergy + 34, 0, 110),
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
