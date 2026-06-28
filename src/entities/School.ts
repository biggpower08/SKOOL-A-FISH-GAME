import type { Bounds, Fish } from "../game/types";

let fishId = 0;

const nextFishId = (): string => {
  fishId += 1;
  return `fish-${fishId}`;
};

export const createSchool = (basicCount: number, supportCount: number, bounds: Bounds): Fish[] => {
  const centerX = bounds.width * 0.42;
  const centerY = bounds.height * 0.5;
  const school: Fish[] = [];

  for (let index = 0; index < supportCount; index += 1) {
    school.push({
      id: nextFishId(),
      kind: "support",
      pos: {
        x: centerX + Math.cos(index) * 26,
        y: centerY + Math.sin(index) * 26,
      },
      vel: { x: 0.35, y: 0 },
      radius: 7,
      maxSpeed: 1.55,
      health: 100,
      maxHealth: 100,
      threatened: false,
      caught: false,
    });
  }

  for (let index = 0; index < basicCount; index += 1) {
    const angle = index * 2.399;
    const ring = 12 + (index % 9) * 4.5;

    school.push({
      id: nextFishId(),
      kind: "basic",
      pos: {
        x: centerX + Math.cos(angle) * ring,
        y: centerY + Math.sin(angle) * ring,
      },
      vel: {
        x: Math.cos(angle + 0.7) * 0.5,
        y: Math.sin(angle + 0.7) * 0.5,
      },
      radius: 4,
      maxSpeed: 1.85,
      health: 1,
      maxHealth: 1,
      threatened: false,
      caught: false,
    });
  }

  return school;
};
