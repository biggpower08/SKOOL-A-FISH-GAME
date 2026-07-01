import type { FishTypeId, RunState } from "../game/types";
import { type ArtifactBuildTag, artifactBuildTagLabels, artifactDefinitions } from "./artifacts";
import type { ActiveFishTypeId } from "./fishTypes";
import { clamp } from "./vector";

type FishNumberMap = Partial<Record<ActiveFishTypeId, number>>;

export type SchoolModifiers = {
  speedMultiplierByType: FishNumberMap;
  healthBonusByType: FishNumberMap;
  evasionBonusByType: FishNumberMap;
  protectionBonusByType: FishNumberMap;
  recruitBonusByType: Partial<Record<FishTypeId, number>>;
  catchResistance: number;
  shellRewardMultiplier: number;
  kelpRestoreBonus: number;
  sharkHungerDrainMultiplier: number;
  riskyShellBonus: number;
};

export const defaultSchoolModifiers = (): SchoolModifiers => ({
  speedMultiplierByType: {},
  healthBonusByType: {},
  evasionBonusByType: {},
  protectionBonusByType: {},
  recruitBonusByType: {},
  catchResistance: 0,
  shellRewardMultiplier: 1,
  kelpRestoreBonus: 0,
  sharkHungerDrainMultiplier: 1,
  riskyShellBonus: 0,
});

const tagCountsForRun = (run: Pick<RunState, "ownedArtifacts">): Map<ArtifactBuildTag, number> => {
  const counts = new Map<ArtifactBuildTag, number>();

  for (const artifactId of run.ownedArtifacts) {
    const artifact = artifactDefinitions.find((candidate) => candidate.id === artifactId);

    if (!artifact) {
      continue;
    }

    for (const tag of artifact.buildTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
};

const count = (tagCounts: Map<ArtifactBuildTag, number>, tag: ArtifactBuildTag): number =>
  tagCounts.get(tag) ?? 0;

const add = (target: FishNumberMap, typeId: ActiveFishTypeId, value: number): void => {
  target[typeId] = (target[typeId] ?? 0) + value;
};

const addSpeed = (target: FishNumberMap, typeId: ActiveFishTypeId, value: number): void => {
  target[typeId] = (target[typeId] ?? 1) + value;
};

export const getSchoolModifiers = (run: Pick<RunState, "fishCounts" | "ownedArtifacts">): SchoolModifiers => {
  const tagCounts = tagCountsForRun(run);
  const modifiers = defaultSchoolModifiers();
  const balanced = count(tagCounts, "balanced-school");
  const tilapia = count(tagCounts, "tilapia-swarm");
  const parrotfish = count(tagCounts, "parrotfish-evasion");
  const grouper = count(tagCounts, "grouper-protector");
  const mahi = count(tagCounts, "mahi-tempo");
  const salmon = count(tagCounts, "salmon-generalist");
  const antiShark = count(tagCounts, "anti-shark-survival");
  const shell = count(tagCounts, "shell-economy");
  const kelp = count(tagCounts, "kelp-recovery");
  const risky = count(tagCounts, "risky-joke");

  if (balanced > 0) {
    for (const typeId of ["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"] as ActiveFishTypeId[]) {
      addSpeed(modifiers.speedMultiplierByType, typeId, Math.min(0.12, balanced * 0.015));
      add(modifiers.healthBonusByType, typeId, Math.min(1.5, balanced * 0.12));
    }
  }

  if (tilapia > 0) {
    modifiers.recruitBonusByType.tilapia = Math.min(3, tilapia);
    add(modifiers.healthBonusByType, "tilapia", Math.min(1, tilapia * 0.18));
  }

  if (parrotfish > 0) {
    addSpeed(modifiers.speedMultiplierByType, "parrotfish", Math.min(0.18, parrotfish * 0.035));
    add(modifiers.evasionBonusByType, "parrotfish", Math.min(0.2, parrotfish * 0.04));
  }

  if (grouper > 0) {
    add(modifiers.healthBonusByType, "grouper", Math.min(3, grouper * 0.75));
    add(modifiers.protectionBonusByType, "grouper", Math.min(0.16, grouper * 0.035));
  }

  if (mahi > 0) {
    addSpeed(modifiers.speedMultiplierByType, "mahi-mahi", Math.min(0.22, mahi * 0.045));
    add(modifiers.evasionBonusByType, "mahi-mahi", Math.min(0.14, mahi * 0.025));
  }

  if (salmon > 0) {
    add(modifiers.healthBonusByType, "salmon", Math.min(2, salmon * 0.45));
    add(modifiers.protectionBonusByType, "salmon", Math.min(0.12, salmon * 0.025));
  }

  modifiers.catchResistance = clamp(antiShark * 0.035 + balanced * 0.01, 0, 0.28);
  modifiers.shellRewardMultiplier = 1 + Math.min(0.45, shell * 0.08);
  modifiers.kelpRestoreBonus = Math.min(6, kelp * 2);
  modifiers.sharkHungerDrainMultiplier = 1 + Math.min(0.35, antiShark * 0.045);
  modifiers.riskyShellBonus = Math.min(20, risky * 4);

  return modifiers;
};

export const buildHintForRun = (run: Pick<RunState, "fishCounts" | "ownedArtifacts">): string => {
  const tagCounts = tagCountsForRun(run);
  let best: ArtifactBuildTag | undefined;
  let bestCount = 0;

  for (const [tag, tagCount] of tagCounts) {
    if (tagCount > bestCount) {
      best = tag;
      bestCount = tagCount;
    }
  }

  return best ? artifactBuildTagLabels[best] : "No build yet";
};
