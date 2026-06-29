import type { ArtifactId } from "../game/types";

export type ArtifactDefinition = {
  id: ArtifactId;
  name: string;
  icon: string;
  rarity: "common" | "rare";
  effect: string;
};

export const artifactDefinitions: ArtifactDefinition[] = [
  {
    id: "shark-tooth-charm",
    name: "Shark Tooth Charm",
    icon: "tooth",
    rarity: "common",
    effect: "Hunger drains faster.",
  },
  {
    id: "bubble-net",
    name: "Bubble Net",
    icon: "net",
    rarity: "common",
    effect: "Fish flee harder.",
  },
  {
    id: "school-bell",
    name: "School Bell",
    icon: "bell",
    rarity: "common",
    effect: "Cohesion improves.",
  },
  {
    id: "pearl-cache",
    name: "Pearl Cache",
    icon: "pearl",
    rarity: "rare",
    effect: "More Shells.",
  },
  {
    id: "kelp-bandage",
    name: "Kelp Bandage",
    icon: "kelp",
    rarity: "common",
    effect: "Healing improves.",
  },
  {
    id: "drift-scale",
    name: "Drift Scale",
    icon: "scale",
    rarity: "rare",
    effect: "Fast fish endure.",
  },
];

export const isArtifactId = (value: string): value is ArtifactId =>
  artifactDefinitions.some((artifact) => artifact.id === value);
