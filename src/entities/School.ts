import type { Bounds, Fish, FishTypeId } from "../game/types";
import { fishTypes } from "../systems/fishTypes";

let fishId = 0;

const nextFishId = (): string => {
  fishId += 1;
  return `fish-${fishId}`;
};

const addFish = (school: Fish[], typeId: FishTypeId, index: number, centerX: number, centerY: number): void => {
  const definition = fishTypes[typeId];
  const angle = index * 2.399;
  const ring = definition.placeholderKind === "support" ? 26 : 12 + (index % 9) * 4.5;

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
    maxSpeed: definition.maxSpeed,
    health: definition.maxHealth,
    maxHealth: definition.maxHealth,
    threatened: false,
    caught: false,
  });
};

export const createSchool = (
  basicCount: number,
  supportCount: number,
  bounds: Bounds,
  fishCounts?: Partial<Record<FishTypeId, number>>,
): Fish[] => {
  const centerX = bounds.width * 0.42;
  const centerY = bounds.height * 0.5;
  const school: Fish[] = [];
  const counts = { ...(fishCounts ?? { tilapia: basicCount }) };

  if (!counts.tilapia && basicCount > 0) {
    counts.tilapia = basicCount;
  }

  counts.support = supportCount;

  let index = 0;
  for (const typeId of ["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper", "support"] as FishTypeId[]) {
    const count = counts[typeId] ?? 0;

    for (let typeIndex = 0; typeIndex < count; typeIndex += 1) {
      addFish(school, typeId, index, centerX, centerY);
      index += 1;
    }
  }

  return school;
};
