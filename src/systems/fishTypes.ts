import type { FishClass, FishKind, FishTypeId } from "../game/types";

export type FishTypeDefinition = {
  id: FishTypeId;
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
  {
    id: "support",
    label: "Support",
    placeholderKind: "support",
    className: "support",
    role: "school energy support",
    maxHealth: 100,
    maxSpeed: 1.75,
    radius: 7,
    color: "#bdefff",
    schooling: "medium",
    support: "energy",
    cost: "high",
  },
];

export const fishTypes = Object.fromEntries(
  fishTypeDefinitions.map((definition) => [definition.id, definition]),
) as Record<FishTypeId, FishTypeDefinition>;

export const defaultFishCounts = (): Partial<Record<FishTypeId, number>> => ({
  tilapia: 36,
});
