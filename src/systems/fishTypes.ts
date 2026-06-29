import type { FishClass, FishKind, FishTypeId } from "../game/types";

export type ActiveFishTypeId = Exclude<FishTypeId, "support">;

export type FishTypeDefinition = {
  id: ActiveFishTypeId;
  label: string;
  placeholderKind: FishKind;
  className: FishClass;
  role: string;
  maxHealth: number;
  maxSpeed: number;
  radius: number;
  color: string;
  schooling: "low" | "medium" | "high";
  support: "none" | "minor" | "protective" | "energy";
  cost: "low" | "medium" | "high";
};

export const fishTypeDefinitions: FishTypeDefinition[] = [
  {
    id: "salmon",
    label: "Salmon",
    placeholderKind: "basic",
    className: "normal",
    role: "balanced generalist",
    maxHealth: 3,
    maxSpeed: 2,
    radius: 4.5,
    color: "#f4d2c7",
    schooling: "medium",
    support: "none",
    cost: "medium",
  },
  {
    id: "tilapia",
    label: "Tilapia",
    placeholderKind: "basic",
    className: "common",
    role: "cheap school size",
    maxHealth: 1,
    maxSpeed: 1.9,
    radius: 4,
    color: "#ffffff",
    schooling: "high",
    support: "none",
    cost: "low",
  },
  {
    id: "parrotfish",
    label: "Parrot",
    placeholderKind: "basic",
    className: "fast",
    role: "evasion fish",
    maxHealth: 2,
    maxSpeed: 2.28,
    radius: 4.25,
    color: "#8ff4d2",
    schooling: "medium",
    support: "minor",
    cost: "high",
  },
  {
    id: "grouper",
    label: "Grouper",
    placeholderKind: "basic",
    className: "tank",
    role: "durable protector",
    maxHealth: 7,
    maxSpeed: 1.45,
    radius: 6,
    color: "#d6c99a",
    schooling: "medium",
    support: "protective",
    cost: "high",
  },
  {
    id: "mahi-mahi",
    label: "Mahi",
    placeholderKind: "basic",
    className: "fast",
    role: "fast evasive fish",
    maxHealth: 2,
    maxSpeed: 2.55,
    radius: 4.25,
    color: "#9fd8ff",
    schooling: "medium",
    support: "none",
    cost: "high",
  },
];

export const fishTypes = Object.fromEntries(
  fishTypeDefinitions.map((definition) => [definition.id, definition]),
) as Record<ActiveFishTypeId, FishTypeDefinition>;

export const defaultFishCounts = (): Partial<Record<FishTypeId, number>> => ({
  tilapia: 36,
});
