import type { Fish, Vector } from "../game/types";
import { clamp } from "../systems/vector";

export type FishWake = {
  radius: number;
  strength: number;
  velocity: Vector;
};

export type FishSwimPose = {
  offsetY: number;
  rotation: number;
};

const hashFishId = (id: string): number =>
  Array.from(id).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 997, 17);

export const fishWakeFor = (fish: Fish): FishWake | null => {
  if (fish.caught) {
    return null;
  }

  const speed = Math.hypot(fish.vel.x, fish.vel.y);
  const speedRatio = clamp(speed / Math.max(0.1, fish.maxSpeed), 0, 1.35);

  if (speedRatio < 0.32) {
    return null;
  }

  const typeScale = fish.typeId === "mahi-mahi" ? 1.22 : fish.typeId === "parrotfish" ? 1.08 : 1;

  return {
    radius: fish.radius * (1.58 + speedRatio * 1.72) * typeScale,
    strength: clamp((0.032 + speedRatio * 0.086) * typeScale, 0.032, 0.18),
    velocity: fish.vel,
  };
};

export const swimPoseForFish = (fish: Fish, time: number): FishSwimPose => {
  if (fish.caught) {
    return { offsetY: 0, rotation: 0 };
  }

  const speed = Math.hypot(fish.vel.x, fish.vel.y);
  const speedRatio = clamp(speed / Math.max(0.1, fish.maxSpeed), 0, 1);
  const seed = hashFishId(fish.id) * 0.031;
  const wave = Math.sin(time * 0.008 + seed);
  const tailWave = Math.sin(time * 0.0065 + seed * 1.7);

  return {
    offsetY: wave * (0.35 + speedRatio * 1.35),
    rotation: clamp(tailWave * (0.012 + speedRatio * 0.052) + fish.vel.y * 0.012, -0.08, 0.08),
  };
};
