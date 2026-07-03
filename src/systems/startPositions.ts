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
