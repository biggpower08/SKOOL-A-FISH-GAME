import type { FishClass, FishKind, FishTypeId } from "../game/types";

export type ActiveFishTypeId = Exclude<FishTypeId, "support">;
export type FishRecruitCounts = Partial<Record<ActiveFishTypeId, number>>;
export type FishBuildTag =
  | "balanced-school"
  | "tilapia-swarm"
  | "parrotfish-evasion"
  | "grouper-protector"
  | "mahi-tempo"
  | "salmon-generalist"
  | "shell-economy"
  | "kelp-recovery"
  | "anti-shark-survival";

export type FishTypeDefinition = {
  id: ActiveFishTypeId;
  label: string;
  placeholderKind: FishKind;
  className: FishClass;
  role: string;
  description: string;
  mechanics: string;
  recruitAmount: number;
  maxHealth: number;
  maxSpeed: number;
  radius: number;
  color: string;
  schooling: "low" | "medium" | "high";
  support: "none" | "minor" | "protective" | "energy";
  cost: "low" | "medium" | "high";
  evasion: number;
  protection: number;
  shellBonus: number;
  recoveryAffinity: number;
  buildTags: FishBuildTag[];
};

export type RecruitmentChoice = {
  id: ActiveFishTypeId;
  amount: number;
  shellCost: number;
  fishCounts: FishRecruitCounts;
  role: string;
  description: string;
  mechanics: string;
  buildTags: FishBuildTag[];
};

export const activeFishTypeIds: ActiveFishTypeId[] = ["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"];

export const fishTypeDefinitions: FishTypeDefinition[] = [
  {
    id: "tilapia",
    label: "Tilapia",
    placeholderKind: "basic",
    className: "common",
    role: "Swarm filler",
    description: "Quantity is a survival strategy.",
    mechanics: "Adds eight fragile bodies that make swarm artifacts matter.",
    recruitAmount: 8,
    maxHealth: 1,
    maxSpeed: 2.12,
    radius: 4,
    color: "#ffffff",
    schooling: "high",
    support: "none",
    cost: "low",
    evasion: 0.02,
    protection: 0,
    shellBonus: 0,
    recoveryAffinity: 0.2,
    buildTags: ["tilapia-swarm", "balanced-school"],
  },
  {
    id: "salmon",
    label: "Salmon",
    placeholderKind: "basic",
    className: "normal",
    role: "Balanced survivor",
    description: "Respectable at everything. Brags modestly.",
    mechanics: "Adds five steady fish with baseline speed, health, and grouping.",
    recruitAmount: 5,
    maxHealth: 3,
    maxSpeed: 2.22,
    radius: 4.5,
    color: "#f4d2c7",
    schooling: "medium",
    support: "none",
    cost: "medium",
    evasion: 0.05,
    protection: 0.05,
    shellBonus: 0.04,
    recoveryAffinity: 0.25,
    buildTags: ["salmon-generalist", "balanced-school"],
  },
  {
    id: "parrotfish",
    label: "Parrotfish",
    placeholderKind: "basic",
    className: "fast",
    role: "Evasive control fish",
    description: "Too fast to explain itself.",
    mechanics: "Adds four agile fish that dodge harder and react cleaner to danger.",
    recruitAmount: 4,
    maxHealth: 2,
    maxSpeed: 2.38,
    radius: 4.25,
    color: "#8ff4d2",
    schooling: "medium",
    support: "minor",
    cost: "high",
    evasion: 0.24,
    protection: 0.04,
    shellBonus: 0,
    recoveryAffinity: 0.18,
    buildTags: ["parrotfish-evasion", "anti-shark-survival"],
  },
  {
    id: "mahi-mahi",
    label: "Mahi-Mahi",
    placeholderKind: "basic",
    className: "fast",
    role: "Tempo sprinter",
    description: "A shiny speed problem with fins.",
    mechanics: "Adds four fragile sprinters with the fastest straight-line speed.",
    recruitAmount: 4,
    maxHealth: 2,
    maxSpeed: 2.76,
    radius: 4.25,
    color: "#9fd8ff",
    schooling: "medium",
    support: "none",
    cost: "high",
    evasion: 0.08,
    protection: 0,
    shellBonus: 0.03,
    recoveryAffinity: 0.14,
    buildTags: ["mahi-tempo", "parrotfish-evasion"],
  },
  {
    id: "grouper",
    label: "Grouper",
    placeholderKind: "basic",
    className: "tank",
    role: "Tanky bodyguard",
    description: "Built like a wet refrigerator.",
    mechanics: "Adds two slow protectors with huge health pools.",
    recruitAmount: 2,
    maxHealth: 7,
    maxSpeed: 1.62,
    radius: 6,
    color: "#d6c99a",
    schooling: "medium",
    support: "protective",
    cost: "high",
    evasion: 0.01,
    protection: 0.34,
    shellBonus: 0,
    recoveryAffinity: 0.35,
    buildTags: ["grouper-protector", "anti-shark-survival"],
  },
];

export const fishTypes = Object.fromEntries(
  fishTypeDefinitions.map((definition) => [definition.id, definition]),
) as Record<ActiveFishTypeId, FishTypeDefinition>;

const baseRecruitmentBundles: Record<ActiveFishTypeId, FishRecruitCounts> = {
  tilapia: { tilapia: 8 },
  salmon: { salmon: 5 },
  parrotfish: { parrotfish: 4 },
  "mahi-mahi": { "mahi-mahi": 4 },
  grouper: { grouper: 2, salmon: 3 },
};

const baseRecruitmentShellCosts: Record<ActiveFishTypeId, number> = {
  tilapia: 0,
  salmon: 0,
  parrotfish: 70,
  "mahi-mahi": 75,
  grouper: 110,
};

const countFishBundle = (fishCounts: FishRecruitCounts): number =>
  Object.values(fishCounts).reduce((sum, count) => sum + (count ?? 0), 0);

const bundleForLevel = (typeId: ActiveFishTypeId, level: number): FishRecruitCounts => {
  const safeLevel = Math.max(1, Math.floor(level));

  if (typeId === "tilapia" && safeLevel >= 10 && safeLevel % 2 === 0) {
    return { tilapia: 7, salmon: 2 };
  }

  if (typeId === "salmon" && safeLevel % 4 === 0) {
    return { salmon: 8 };
  }

  if (typeId === "parrotfish" && safeLevel % 3 === 0) {
    return { parrotfish: 4, tilapia: 3 };
  }

  if (typeId === "mahi-mahi" && safeLevel > 1 && safeLevel % 4 === 1) {
    return { "mahi-mahi": 5 };
  }

  if (typeId === "grouper" && safeLevel % 5 === 0) {
    return { grouper: 3, salmon: 2 };
  }

  return baseRecruitmentBundles[typeId];
};

const shellCostForLevel = (typeId: ActiveFishTypeId, level: number, fishCounts: FishRecruitCounts): number => {
  const baseCost = baseRecruitmentShellCosts[typeId];

  if (baseCost === 0) {
    return 0;
  }

  const extraFish = Math.max(0, countFishBundle(fishCounts) - countFishBundle(baseRecruitmentBundles[typeId]));
  return baseCost + extraFish * 18 + Math.floor(Math.max(0, level - 1) / 10) * 10;
};

export const recruitmentChoicesForLevel = (level: number): RecruitmentChoice[] => fishTypeDefinitions.map((definition) => {
  const fishCounts = bundleForLevel(definition.id, level);

  return {
    id: definition.id,
    amount: countFishBundle(fishCounts),
    shellCost: shellCostForLevel(definition.id, level, fishCounts),
    fishCounts,
    role: definition.role,
    description: definition.description,
    mechanics: definition.mechanics,
    buildTags: definition.buildTags,
  };
});

export const recruitmentChoices: RecruitmentChoice[] = recruitmentChoicesForLevel(1);

export const getRecruitmentChoice = (typeId: string, level = 1): RecruitmentChoice | undefined =>
  recruitmentChoicesForLevel(level).find((choice) => choice.id === typeId);

export const formatFishCountSummary = (fishCounts: Partial<Record<FishTypeId, number>>): string =>
  Object.entries(fishCounts)
    .filter((entry): entry is [ActiveFishTypeId, number] => activeFishTypeIds.includes(entry[0] as ActiveFishTypeId) && (entry[1] ?? 0) > 0)
    .map(([typeId, count]) => `+${count} ${fishTypes[typeId].label}`)
    .join(", ");

export const defaultFishCounts = (): Partial<Record<FishTypeId, number>> => ({
  tilapia: 54,
});
