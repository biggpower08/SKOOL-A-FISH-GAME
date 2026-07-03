import type { ArtifactId, ChoiceId, FishTypeId, LevelConfig, RewardFlow, RunState } from "../game/types";
import { getSchoolModifiers } from "./artifactEffects";
import { activeFishTypeIds, defaultFishCounts, fishTypes, formatFishCountSummary, getRecruitmentChoice } from "./fishTypes";
import { clamp } from "./vector";

export const STARTING_FISH_COUNT = 54;
export const DEV_FREE_PURCHASES = import.meta.env.MODE === "development";
const KELP_COST = 100;
const KELP_RESTORE_COUNT = 5;
const INVESTMENT_AMOUNT = 100;
const INVESTMENT_RETURN_ROUNDS = 3;
const ACTIVE_RECRUIT_TYPES = new Set<FishTypeId>(["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"]);
type FishCountMap = Partial<Record<FishTypeId, number>>;
type ChoiceOptions = {
  freePurchases?: boolean;
};

export const createNewRun = (): RunState => ({
  level: 1,
  fishCount: STARTING_FISH_COUNT,
  maxFishCount: STARTING_FISH_COUNT,
  supportCount: 0,
  fishCounts: defaultFishCounts(),
  lostFishCounts: {},
  ownedArtifacts: [],
  currency: 0,
  invested: 0,
  investmentReturnLevel: null,
  lastInvestmentReturn: 0,
  lastRecruitmentSummary: "",
  lastRecoverySummary: "",
  schoolEnergy: 100,
  bestLevel: 1,
});

export const rewardFlowForCompletedLevel = (level: number): RewardFlow => {
  if (level === 1) {
    return "recruit";
  }

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
  const modifiers = getSchoolModifiers(run);
  const rewardCurrency = Math.round(config.rewardCurrency * modifiers.shellRewardMultiplier + modifiers.riskyShellBonus);

  return {
    ...run,
    currency: run.currency + rewardCurrency + returnedInvestment,
    invested: returnedInvestment > 0 ? 0 : run.invested,
    investmentReturnLevel: returnedInvestment > 0 ? null : run.investmentReturnLevel,
    lastInvestmentReturn: returnedInvestment,
    bestLevel: Math.max(run.bestLevel, config.level),
  };
};

const totalFishCounts = (fishCounts: FishCountMap): number =>
  activeFishTypeIds.reduce((sum, typeId) => sum + Math.max(0, fishCounts[typeId] ?? 0), 0);

const cleanFishCounts = (fishCounts: FishCountMap): FishCountMap => {
  const cleaned: FishCountMap = {};

  for (const typeId of activeFishTypeIds) {
    const count = Math.max(0, Math.round(fishCounts[typeId] ?? 0));

    if (count > 0) {
      cleaned[typeId] = count;
    }
  }

  return cleaned;
};

const addFishCounts = (left: FishCountMap, right: FishCountMap): FishCountMap => {
  const combined: FishCountMap = { ...left };

  for (const typeId of activeFishTypeIds) {
    const count = right[typeId] ?? 0;

    if (count > 0) {
      combined[typeId] = (combined[typeId] ?? 0) + count;
    }
  }

  return cleanFishCounts(combined);
};

const subtractFishCounts = (left: FishCountMap, right: FishCountMap): FishCountMap => {
  const remaining: FishCountMap = { ...left };

  for (const typeId of activeFishTypeIds) {
    const count = right[typeId] ?? 0;

    if (count > 0) {
      remaining[typeId] = Math.max(0, (remaining[typeId] ?? 0) - count);
    }
  }

  return cleanFishCounts(remaining);
};

const applyFishRecoveryCounts = (run: RunState, recoveryPool: FishCountMap, restoredCounts: FishCountMap, summary: string): RunState => {
  const restored = totalFishCounts(restoredCounts);

  if (restored <= 0) {
    return {
      ...run,
      lostFishCounts: cleanFishCounts(recoveryPool),
      lastRecoverySummary: "",
    };
  }

  return {
    ...run,
    fishCount: run.fishCount + restored,
    fishCounts: addFishCounts(run.fishCounts, restoredCounts),
    lostFishCounts: subtractFishCounts(recoveryPool, restoredCounts),
    lastRecruitmentSummary: "",
    lastRecoverySummary: summary,
  };
};

const chooseRecoveryCounts = (recoveryPool: FishCountMap, target: number): FishCountMap => {
  const totalLost = totalFishCounts(recoveryPool);
  const cappedTarget = Math.min(totalLost, Math.max(0, Math.round(target)));
  const restoredCounts: FishCountMap = {};

  if (cappedTarget <= 0 || totalLost <= 0) {
    return restoredCounts;
  }

  const quotas = activeFishTypeIds
    .map((typeId) => {
      const lost = Math.max(0, recoveryPool[typeId] ?? 0);
      const raw = (lost / totalLost) * cappedTarget;

      return {
        typeId,
        lost,
        raw,
        restored: Math.min(lost, Math.floor(raw)),
      };
    })
    .filter((quota) => quota.lost > 0);

  let restored = 0;

  for (const quota of quotas) {
    if (quota.restored > 0) {
      restoredCounts[quota.typeId] = quota.restored;
      restored += quota.restored;
    }
  }

  while (restored < cappedTarget) {
    const next = quotas
      .filter((quota) => quota.restored < quota.lost)
      .sort((left, right) => {
        const leftNeed = left.raw - left.restored;
        const rightNeed = right.raw - right.restored;

        if (rightNeed !== leftNeed) {
          return rightNeed - leftNeed;
        }

        return fishTypes[right.typeId].maxSpeed - fishTypes[left.typeId].maxSpeed;
      })[0];

    if (!next) {
      break;
    }

    next.restored += 1;
    restoredCounts[next.typeId] = (restoredCounts[next.typeId] ?? 0) + 1;
    restored += 1;
  }

  return cleanFishCounts(restoredCounts);
};

export const lostFishCountsAfterRound = (before: FishCountMap, after: FishCountMap): FishCountMap => {
  const lost: FishCountMap = {};

  for (const typeId of activeFishTypeIds) {
    const count = Math.max(0, (before[typeId] ?? 0) - (after[typeId] ?? 0));

    if (count > 0) {
      lost[typeId] = count;
    }
  }

  return lost;
};

export const applyRoundRecovery = (run: RunState, roundLostCounts: FishCountMap): RunState => {
  const recoveryPool = addFishCounts(run.lostFishCounts, roundLostCounts);
  const totalLost = totalFishCounts(recoveryPool);
  const missing = Math.max(0, run.maxFishCount - run.fishCount);
  const target = Math.min(missing, Math.ceil(totalLost * 0.2));
  const restoredCounts = chooseRecoveryCounts(recoveryPool, target);
  const restored = totalFishCounts(restoredCounts);

  return applyFishRecoveryCounts(
    run,
    recoveryPool,
    restoredCounts,
    restored > 0 ? `Recovered ${restored} fish after the wave: ${formatFishCountSummary(restoredCounts)}` : "",
  );
};

export const applyChoice = (run: RunState, choice: ChoiceId, options: ChoiceOptions = {}): RunState => {
  const modifiers = getSchoolModifiers(run);
  const freePurchases = options.freePurchases ?? DEV_FREE_PURCHASES;
  const recruitmentChoice = getRecruitmentChoice(choice, run.level);

  if (recruitmentChoice) {
    if (!freePurchases && run.currency < recruitmentChoice.shellCost) {
      return {
        ...run,
        lastRecruitmentSummary: "Not enough Shells",
      };
    }

    const fishCounts = { ...recruitmentChoice.fishCounts };
    const recruitBonus = modifiers.recruitBonusByType[recruitmentChoice.id] ?? 0;

    if (recruitBonus > 0) {
      fishCounts[recruitmentChoice.id] = (fishCounts[recruitmentChoice.id] ?? 0) + recruitBonus;
    }

    const fishToAdd = totalFishCounts(fishCounts);

    return {
      ...run,
      currency: freePurchases ? Math.max(0, run.currency - recruitmentChoice.shellCost) : run.currency - recruitmentChoice.shellCost,
      fishCount: run.fishCount + fishToAdd,
      maxFishCount: Math.max(run.maxFishCount, run.fishCount) + fishToAdd,
      fishCounts: addFishCounts(run.fishCounts, fishCounts),
      lastRecruitmentSummary: `School grew! ${formatFishCountSummary(fishCounts)}`,
      lastRecoverySummary: "",
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
  const savedRecoveryPool = cleanFishCounts(run.lostFishCounts);
  const recoveryPool = totalFishCounts(savedRecoveryPool) > 0 ? savedRecoveryPool : { tilapia: missing };
  const restoredCounts = run.currency >= KELP_COST ? chooseRecoveryCounts(recoveryPool, Math.min(KELP_RESTORE_COUNT + modifiers.kelpRestoreBonus, missing)) : {};
  const restored = totalFishCounts(restoredCounts);
  const recoveredRun = applyFishRecoveryCounts(
    run,
    recoveryPool,
    restoredCounts,
    restored > 0 ? `Recovered ${restored} fish with kelp: ${formatFishCountSummary(restoredCounts)}` : "",
  );

  return {
    ...recoveredRun,
    currency: restored > 0 ? run.currency - KELP_COST : run.currency,
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
    lostFishCounts: cleanFishCounts(run.lostFishCounts ?? {}),
    investmentReturnLevel: run.investmentReturnLevel ?? null,
    lastInvestmentReturn: run.lastInvestmentReturn ?? 0,
    lastRecruitmentSummary: run.lastRecruitmentSummary ?? "",
    lastRecoverySummary: run.lastRecoverySummary ?? "",
  };
};
