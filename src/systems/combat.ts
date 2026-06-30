import type { Fish, LevelConfig, Shark, Vector } from "../game/types";
import { ROUND_ONE_TARGET_CATCH_RATE } from "./levels";
import { distance } from "./vector";

export type SharkAttackResult = {
  caught: number;
  damagedSupport: number;
};

export const aliveFish = (fish: Fish[]): Fish[] => fish.filter((candidate) => !candidate.caught);

export const schoolCenter = (fish: Fish[]): Vector => {
  const alive = aliveFish(fish);

  if (alive.length === 0) {
    return { x: 0, y: 0 };
  }

  const total = alive.reduce<Vector>(
    (sum, candidate) => ({
      x: sum.x + candidate.pos.x,
      y: sum.y + candidate.pos.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / alive.length,
    y: total.y / alive.length,
  };
};

const attackCatchRatio = (config: LevelConfig): number => {
  const hardMode = Math.max(0, config.level - 70);
  return Math.min(0.42, ROUND_ONE_TARGET_CATCH_RATE + (config.level - 1) * 0.0018 + hardMode * 0.003);
};

const damageForFish = (fish: Fish, config: LevelConfig): number => {
  if (fish.kind === "support") {
    return 34 + config.level * 0.7;
  }

  return 1 + config.level * 0.08;
};

export const applySharkAttack = (
  fish: Fish[],
  shark: Shark,
  config: LevelConfig,
  random: () => number = Math.random,
): SharkAttackResult => {
  const available = aliveFish(fish);
  const inRange = available.filter((candidate) => distance(candidate.pos, shark.pos) <= shark.attackRadius);
  const candidates = inRange.length > 0 ? inRange : available.slice(0, Math.max(1, Math.round(available.length * 0.1)));

  if (candidates.length === 0) {
    return { caught: 0, damagedSupport: 0 };
  }

  const catchCount = Math.min(candidates.length, Math.max(1, Math.round(candidates.length * attackCatchRatio(config))));
  const chosen = candidates
    .map((candidate) => ({ candidate, roll: random() }))
    .sort((a, b) => a.roll - b.roll)
    .slice(0, catchCount);

  let caught = 0;
  let damagedSupport = 0;

  for (const item of chosen) {
    item.candidate.health -= damageForFish(item.candidate, config);

    if (item.candidate.kind === "support") {
      damagedSupport += 1;
    }

    if (item.candidate.health > 0) {
      continue;
    }

    if (!item.candidate.caught) {
      item.candidate.caught = true;
      item.candidate.caughtTimer = 0.32;
      caught += 1;
    }
  }

  if (caught > 0) {
    shark.hunger = Math.min(shark.maxHunger, shark.hunger + caught * (5.5 + config.level * 0.08));
    shark.feedingRecovery = 0.34;
  }

  return { caught, damagedSupport };
};

export const drainSharkHunger = (sharks: Shark[], dt: number): void => {
  for (const shark of sharks) {
    if (shark.health <= 0 || shark.starved) {
      continue;
    }

    shark.hunger = Math.max(0, shark.hunger - shark.hungerDrain * dt);

    if (shark.hunger === 0) {
      shark.starved = true;
      shark.vel = { x: 0, y: 0 };
    }
  }
};

export const applySchoolPressure = (fish: Fish[], sharks: Shark[], dt: number): void => {
  const alive = aliveFish(fish);
  const activeSharks = sharks.filter((shark) => shark.health > 0 && !shark.starved);

  if (alive.length === 0 || activeSharks.length === 0) {
    return;
  }

  const supportCount = alive.filter((candidate) => candidate.kind === "support").length;
  const pressure = (alive.length * 0.15 + supportCount * 0.32) * dt;
  const damagePerShark = pressure / activeSharks.length;

  for (const shark of activeSharks) {
    shark.health = Math.max(0, shark.health - damagePerShark);
  }
};
