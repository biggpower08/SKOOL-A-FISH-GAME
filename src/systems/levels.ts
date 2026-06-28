import type { LevelConfig, LevelType } from "../game/types";

const levelTypeFor = (level: number): LevelType => {
  if (level === 1 || level === 70) {
    return "fight";
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

  if (level % 7 === 0) {
    return "shop";
  }

  return "fight";
};

export const createLevelConfig = (level: number): LevelConfig => {
  const safeLevel = Math.max(1, Math.floor(level));
  const type = levelTypeFor(safeLevel);
  const hardMode = Math.max(0, safeLevel - 70);
  const levelPressure = Math.pow(safeLevel, 1.12);
  const specialBonus = type === "special" ? 1 : 0;

  return {
    level: safeLevel,
    type,
    sharkCount: Math.min(8, 1 + Math.floor((safeLevel - 1) / 12) + specialBonus + Math.floor(hardMode / 16)),
    sharkHealth: Math.round(66 + levelPressure * 6.5 + hardMode * 13),
    sharkSpeed: Number((0.72 + Math.min(1.32, safeLevel * 0.018) + hardMode * 0.012).toFixed(2)),
    sharkAttackRate: Number(Math.max(1.55, 4.25 - Math.min(2, safeLevel * 0.028) - hardMode * 0.02).toFixed(2)),
    fishThreatRadius: Math.round(106 + Math.min(58, safeLevel * 0.68) + specialBonus * 16),
    rewardCurrency: Math.round(6 + safeLevel * 0.8 + (type === "reward" ? 14 : 0)),
  };
};
