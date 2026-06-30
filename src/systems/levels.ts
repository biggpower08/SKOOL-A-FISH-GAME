import type { LevelConfig, LevelPathStep, LevelType, SharkKind } from "../game/types";

export const ROUND_ONE_TARGET_CATCH_RATE = 0.18;
export const ROUND_ONE_TARGET_CATCH_COUNT = 4;
export const EARLY_ROUND_SHELL_REWARD = 150;
export const SHELL_REWARD_PER_LEVEL = 10;

const levelTypeFor = (level: number): LevelType => {
  if (level === 1 || level === 70) {
    return "fight";
  }

  if (level % 14 === 7) {
    return "recruit";
  }

  if (level % 20 === 0) {
    return "reward";
  }

  if (level % 13 === 0) {
    return "investment";
  }

  if (level % 10 === 0) {
    return "special";
  }

  if (level % 11 === 0) {
    return "shop";
  }

  return "fight";
};

const sharkTypesFor = (level: number, type: LevelType, sharkCount: number): SharkKind[] => {
  const types: SharkKind[] = ["basic"];

  if (level >= 8 || type === "special") {
    types.push("fast");
  }

  if (level >= 16) {
    types.push("center");
  }

  if (level >= 28 || type === "special") {
    types.push("barracuda");
  }

  if (level >= 55 && type === "special") {
    types.push("eel");
  }

  while (types.length < sharkCount) {
    types.push(types[types.length % Math.max(1, types.length)]);
  }

  return types.slice(0, sharkCount);
};

const pathIconFor = (type: LevelType): string => {
  if (type === "shop") {
    return "S";
  }

  if (type === "investment") {
    return "+";
  }

  if (type === "recruit") {
    return "+";
  }

  if (type === "special") {
    return "!";
  }

  if (type === "reward") {
    return "*";
  }

  return "o";
};

const pathLabelFor = (type: LevelType): string => {
  if (type === "shop") {
    return "Shop";
  }

  if (type === "investment") {
    return "Recover";
  }

  if (type === "recruit") {
    return "Recruit";
  }

  if (type === "special") {
    return "Special";
  }

  if (type === "reward") {
    return "Reward";
  }

  return "Fight";
};

export const createLevelConfig = (level: number): LevelConfig => {
  const safeLevel = Math.max(1, Math.floor(level));
  const type = levelTypeFor(safeLevel);
  const hardMode = Math.max(0, safeLevel - 70);
  const levelPressure = Math.pow(safeLevel, 1.12);
  const specialBonus = type === "special" ? 1 : 0;
  const sharkCount = Math.min(
    8,
    1 + Math.floor((safeLevel - 1) / 12) + (safeLevel >= 24 ? 1 : 0) + specialBonus + Math.floor(hardMode / 16),
  );

  return {
    level: safeLevel,
    type,
    sharkCount,
    sharkHealth: Math.round(66 + levelPressure * 6.5 + hardMode * 13),
    sharkSpeed: Number((2.7 + Math.min(1.35, safeLevel * 0.013) + hardMode * 0.012).toFixed(2)),
    sharkAttackRate: Number(Math.max(1.55, 4.25 - Math.min(2, safeLevel * 0.028) - hardMode * 0.02).toFixed(2)),
    fishThreatRadius: Math.round(106 + Math.min(58, safeLevel * 0.68) + specialBonus * 16),
    rewardCurrency: EARLY_ROUND_SHELL_REWARD + safeLevel * SHELL_REWARD_PER_LEVEL + (type === "reward" ? 50 : 0),
    sharkTypes: sharkTypesFor(safeLevel, type, sharkCount),
  };
};

export const createLevelPathPreview = (currentLevel: number, count = 6): LevelPathStep[] => {
  const safeCurrent = Math.max(1, Math.floor(currentLevel));

  return Array.from({ length: count }, (_, index) => {
    const config = createLevelConfig(safeCurrent + index);

    return {
      level: config.level,
      type: config.type,
      icon: pathIconFor(config.type),
      label: pathLabelFor(config.type),
      current: index === 0,
    };
  });
};
