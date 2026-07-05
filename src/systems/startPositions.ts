import type { Bounds, Vector } from "../game/types";
import { clamp, distance, normalize, scale, subtract } from "./vector";

export type SafeInteriorRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type SharkStart = {
  pos: Vector;
  vel: Vector;
};

export type KelpGoalState = "dormant" | "feeding" | "consumed" | "respawning";

export type KelpGoal = {
  pos: Vector;
  radius: number;
  state: KelpGoalState;
  progress: number;
  alpha: number;
};

export type FeedableKelpGoal = KelpGoal & {
  state: "dormant" | "feeding";
};

export const MIN_SHARK_START_DISTANCE = 230;

const seededUnit = (seed: number, salt: number): number => {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;

  return value - Math.floor(value);
};

export const safeInteriorRect = (bounds: Bounds): SafeInteriorRect => {
  const xMargin = clamp(bounds.width * 0.18, 104, 170);
  const yMargin = clamp(bounds.height * 0.2, 88, 142);

  return {
    left: xMargin,
    right: bounds.width - xMargin,
    top: yMargin,
    bottom: bounds.height - yMargin,
  };
};

export const schoolStartAnchor = (bounds: Bounds, seed = 1): Vector => {
  const safe = safeInteriorRect(bounds);
  const x = safe.left + (safe.right - safe.left) * seededUnit(seed, 1);
  const y = safe.top + (safe.bottom - safe.top) * seededUnit(seed, 2);

  return {
    x: clamp(x, safe.left, safe.right),
    y: clamp(y, safe.top, safe.bottom),
  };
};

export const schoolRoamDestination = (bounds: Bounds, seed: number, schoolCenter: Vector, sharkPositions: Vector[] = []): Vector => {
  const safe = safeInteriorRect(bounds);
  const candidates = Array.from({ length: 6 }, (_, index) => ({
    x: safe.left + (safe.right - safe.left) * seededUnit(seed + index * 3, 3),
    y: safe.top + (safe.bottom - safe.top) * seededUnit(seed + index * 5, 4),
  }));

  return candidates.reduce((best, candidate) => {
    const wallSpace = Math.min(candidate.x - safe.left, safe.right - candidate.x, candidate.y - safe.top, safe.bottom - candidate.y);
    const sharkSpace = sharkPositions.length > 0 ? Math.min(...sharkPositions.map((shark) => distance(candidate, shark))) : 180;
    const travel = distance(candidate, schoolCenter);
    const score = wallSpace * 0.8 + sharkSpace * 1.35 - Math.abs(travel - 190) * 0.4;
    const bestWallSpace = Math.min(best.x - safe.left, safe.right - best.x, best.y - safe.top, safe.bottom - best.y);
    const bestSharkSpace = sharkPositions.length > 0 ? Math.min(...sharkPositions.map((shark) => distance(best, shark))) : 180;
    const bestTravel = distance(best, schoolCenter);
    const bestScore = bestWallSpace * 0.8 + bestSharkSpace * 1.35 - Math.abs(bestTravel - 190) * 0.4;

    return score > bestScore ? candidate : best;
  }, candidates[0]);
};

export const kelpGoalPosition = (bounds: Bounds, seed: number, schoolCenter: Vector, sharkPositions: Vector[] = []): KelpGoal => {
  const safe = safeInteriorRect(bounds);
  const candidates = Array.from({ length: 7 }, (_, index) => ({
    x: safe.left + (safe.right - safe.left) * seededUnit(seed + index * 7, 9),
    y: safe.top + (safe.bottom - safe.top) * seededUnit(seed + index * 11, 10),
  }));

  const pos = candidates.reduce((best, candidate) => {
    const wallSpace = Math.min(candidate.x - safe.left, safe.right - candidate.x, candidate.y - safe.top, safe.bottom - candidate.y);
    const sharkSpace = sharkPositions.length > 0 ? Math.min(...sharkPositions.map((shark) => distance(candidate, shark))) : 220;
    const travel = distance(candidate, schoolCenter);
    const score = wallSpace * 1.1 + sharkSpace * 1.2 - Math.abs(travel - 150) * 0.32;
    const bestWallSpace = Math.min(best.x - safe.left, safe.right - best.x, best.y - safe.top, safe.bottom - best.y);
    const bestSharkSpace = sharkPositions.length > 0 ? Math.min(...sharkPositions.map((shark) => distance(best, shark))) : 220;
    const bestTravel = distance(best, schoolCenter);
    const bestScore = bestWallSpace * 1.1 + bestSharkSpace * 1.2 - Math.abs(bestTravel - 150) * 0.32;

    return score > bestScore ? candidate : best;
  }, candidates[0]);

  return {
    pos: {
      x: clamp(pos.x, safe.left, safe.right),
      y: clamp(pos.y, safe.top, safe.bottom),
    },
    radius: 22,
    state: "dormant",
    progress: 0,
    alpha: 1,
  };
};

export const isFeedableKelpGoal = (goal: KelpGoal | null | undefined): goal is FeedableKelpGoal =>
  goal?.state === "dormant" || goal?.state === "feeding";

export const advanceKelpFeeding = (goal: KelpGoal, fishOverlapping: number, dt: number): KelpGoal => {
  if (!isFeedableKelpGoal(goal)) {
    return goal;
  }

  const cappedFeeders = Math.min(8, Math.max(0, fishOverlapping));

  if (cappedFeeders === 0) {
    return {
      ...goal,
      state: goal.progress > 0.02 ? "feeding" : "dormant",
    };
  }

  const progress = clamp(goal.progress + cappedFeeders * dt * 0.014, 0, 1);

  if (progress >= 1) {
    return {
      ...goal,
      state: "consumed",
      progress: 1,
      alpha: 1,
    };
  }

  return {
    ...goal,
    state: "feeding",
    progress,
    alpha: 1,
  };
};

export const fadeConsumedKelp = (goal: KelpGoal, dt: number): KelpGoal => {
  if (goal.state !== "consumed") {
    return goal;
  }

  const alpha = clamp(goal.alpha - dt * 0.75, 0, 1);

  return {
    ...goal,
    alpha,
    state: alpha <= 0 ? "respawning" : "consumed",
  };
};

export const sharkStartPosition = (
  bounds: Bounds,
  level: number,
  index: number,
  sharkCount: number,
  schoolAnchor: Vector,
  radius: number,
  speed = 0,
): SharkStart => {
  const margin = radius + 54;
  const spread = ((index + 1) / (sharkCount + 1) - 0.5) * Math.min(bounds.width, bounds.height) * 0.46;
  const candidates: Vector[] = [
    { x: bounds.width - margin, y: clamp(bounds.height / 2 + spread, margin, bounds.height - margin) },
    { x: margin, y: clamp(bounds.height / 2 - spread, margin, bounds.height - margin) },
    { x: clamp(bounds.width / 2 + spread, margin, bounds.width - margin), y: margin },
    { x: clamp(bounds.width / 2 - spread, margin, bounds.width - margin), y: bounds.height - margin },
  ];
  const preferred = (level + index) % candidates.length;
  const ordered = candidates.slice(preferred).concat(candidates.slice(0, preferred));
  const pos =
    ordered.find((candidate) => distance(candidate, schoolAnchor) >= MIN_SHARK_START_DISTANCE) ??
    ordered.reduce((best, candidate) => (distance(candidate, schoolAnchor) > distance(best, schoolAnchor) ? candidate : best), ordered[0]);
  const direction = normalize(subtract(schoolAnchor, pos));

  return {
    pos,
    vel: scale(direction, speed),
  };
};
