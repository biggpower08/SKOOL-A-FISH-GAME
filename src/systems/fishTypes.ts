import type { FishClass, FishKind, FishTypeId } from "../game/types";

export type ActiveFishTypeId = Exclude<FishTypeId, "support">;
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

export const fishTypeDefinitions: FishTypeDefinition[] = [
  {
    id: "tilapia",
    label: "Tilapia",
    placeholderKind: "basic",
    className: "common",
    role: "Swarm filler",
    description: "Quantity is a survival strategy.",
    mechanics: "Adds five fragile bodies that make swarm artifacts matter.",
    recruitAmount: 5,
    maxHealth: 1,
    maxSpeed: 1.9,
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
    mechanics: "Adds three steady fish with baseline speed, health, and grouping.",
    recruitAmount: 3,
    maxHealth: 3,
    maxSpeed: 2,
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
    role: "Fast evasive fish",
    description: "Too fast to explain itself.",
    mechanics: "Adds two quick fish with the best dodge identity.",
    recruitAmount: 2,
    maxHealth: 2,
    maxSpeed: 2.34,
    radius: 4.25,
    color: "#8ff4d2",
    schooling: "medium",
    support: "minor",
    cost: "high",
    evasion: 0.18,
    protection: 0.03,
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
    mechanics: "Adds two fragile sprinters that reward speed and tempo artifacts.",
    recruitAmount: 2,
    maxHealth: 2,
    maxSpeed: 2.55,
    radius: 4.25,
    color: "#9fd8ff",
    schooling: "medium",
    support: "none",
    cost: "high",
    evasion: 0.12,
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
    mechanics: "Adds one slow protector with a huge health pool.",
    recruitAmount: 1,
    maxHealth: 7,
    maxSpeed: 1.45,
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

export const recruitmentChoices = fishTypeDefinitions.map((definition) => ({
  id: definition.id,
  amount: definition.recruitAmount,
  role: definition.role,
  description: definition.description,
  mechanics: definition.mechanics,
  buildTags: definition.buildTags,
}));

export const defaultFishCounts = (): Partial<Record<FishTypeId, number>> => ({
  tilapia: 40,
});
