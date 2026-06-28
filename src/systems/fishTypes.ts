import type { FishKind } from "../game/types";

export type PlannedFishType = {
  id: string;
  placeholderKind: FishKind;
  role: string;
  health: "low" | "medium" | "high";
  speed: "low" | "medium" | "high" | "very-high";
  schooling: "low" | "medium" | "high";
  support: "none" | "minor" | "protective" | "energy";
  cost: "low" | "medium" | "high";
};

export const plannedFishTypes: PlannedFishType[] = [
  {
    id: "salmon",
    placeholderKind: "basic",
    role: "balanced generalist",
    health: "medium",
    speed: "medium",
    schooling: "medium",
    support: "none",
    cost: "medium",
  },
  {
    id: "tilapia",
    placeholderKind: "basic",
    role: "cheap school size",
    health: "low",
    speed: "medium",
    schooling: "high",
    support: "none",
    cost: "low",
  },
  {
    id: "parrotfish",
    placeholderKind: "basic",
    role: "evasion fish",
    health: "medium",
    speed: "high",
    schooling: "medium",
    support: "minor",
    cost: "high",
  },
  {
    id: "grouper",
    placeholderKind: "basic",
    role: "durable protector",
    health: "high",
    speed: "low",
    schooling: "medium",
    support: "protective",
    cost: "high",
  },
  {
    id: "mahi-mahi",
    placeholderKind: "basic",
    role: "fast evasive fish",
    health: "medium",
    speed: "very-high",
    schooling: "medium",
    support: "none",
    cost: "high",
  },
  {
    id: "support",
    placeholderKind: "support",
    role: "school energy support",
    health: "medium",
    speed: "medium",
    schooling: "medium",
    support: "energy",
    cost: "high",
  },
];
