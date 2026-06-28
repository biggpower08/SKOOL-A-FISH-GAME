import type { ChoiceId, LevelConfig, RunState } from "../game/types";
import { clamp } from "./vector";

export const createNewRun = (): RunState => ({
  level: 1,
  fishCount: 32,
  supportCount: 1,
  currency: 0,
  invested: 0,
  schoolEnergy: 100,
  bestLevel: 1,
});

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
  if (choice === "fish") {
    const supportGain = run.level >= 6 && run.level % 4 === 0 ? 1 : 0;

    return {
      ...run,
      fishCount: run.fishCount + 5 + Math.floor(run.level / 18),
      supportCount: Math.min(5, run.supportCount + supportGain),
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

  return {
    ...run,
    currency: Math.max(0, run.currency - 5),
    fishCount: run.fishCount + (run.currency >= 5 ? 2 : 1),
    schoolEnergy: clamp(run.schoolEnergy + 34, 0, 110),
  };
};
