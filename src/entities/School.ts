import type { Bounds, Fish, FishTypeId } from "../game/types";
import type { SchoolModifiers } from "../systems/artifactEffects";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";
import { schoolStartAnchor } from "../systems/startPositions";
import { clamp } from "../systems/vector";

let fishId = 0;

const nextFishId = (): string => {
  fishId += 1;
  return `fish-${fishId}`;
};

const addFish = (
  school: Fish[],
  typeId: ActiveFishTypeId,
  index: number,
  centerX: number,
  centerY: number,
  modifiers?: SchoolModifiers,
): void => {
  const definition = fishTypes[typeId];
  const angle = index * 2.399;
  const ring = 18 + Math.sqrt(index) * 16;
  const maxHealth = Math.max(1, Math.ceil(definition.maxHealth + (modifiers?.healthBonusByType[typeId] ?? 0)));

  school.push({
    id: nextFishId(),
    kind: definition.placeholderKind,
    typeId,
    className: definition.className,
    pos: {
      x: centerX + Math.cos(angle) * ring,
      y: centerY + Math.sin(angle) * ring,
    },
    vel: {
      x: Math.cos(angle + 0.7) * 0.5,
      y: Math.sin(angle + 0.7) * 0.5,
    },
    radius: definition.radius,
    maxSpeed: definition.maxSpeed * (modifiers?.speedMultiplierByType[typeId] ?? 1),
    health: maxHealth,
    maxHealth,
    evasion: clamp(definition.evasion + (modifiers?.evasionBonusByType[typeId] ?? 0), 0, 0.65),
    protection: clamp(definition.protection + (modifiers?.protectionBonusByType[typeId] ?? 0), 0, 0.7),
    threatened: false,
    caught: false,
    facingX: Math.cos(angle + 0.7) < -0.2 ? -1 : 1,
  });
};

export const createSchool = (
  basicCount: number,
  _supportCount: number,
  bounds: Bounds,
  fishCounts?: Partial<Record<FishTypeId, number>>,
  modifiers?: SchoolModifiers,
  startSeed = 1,
): Fish[] => {
  const anchor = schoolStartAnchor(bounds, startSeed);
  const centerX = anchor.x;
  const centerY = anchor.y;
  const school: Fish[] = [];
  const counts = { ...(fishCounts ?? { tilapia: basicCount }) };

  if (!counts.tilapia && basicCount > 0) {
    counts.tilapia = basicCount;
  }

  let index = 0;
  for (const typeId of ["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"] as ActiveFishTypeId[]) {
    const count = counts[typeId] ?? 0;

    for (let typeIndex = 0; typeIndex < count; typeIndex += 1) {
      addFish(school, typeId, index, centerX, centerY, modifiers);
      index += 1;
    }
  }

  return school;
};
