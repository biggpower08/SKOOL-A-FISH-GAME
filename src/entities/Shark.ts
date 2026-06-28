import type { Bounds, Fish, LevelConfig, Shark } from "../game/types";
import { aliveFish, schoolCenter } from "../systems/combat";
import { clamp, distance, limit, normalize, scale, subtract } from "../systems/vector";

export const createSharks = (config: LevelConfig, bounds: Bounds): Shark[] => {
  const sharks: Shark[] = [];

  for (let index = 0; index < config.sharkCount; index += 1) {
    const y = ((index + 1) / (config.sharkCount + 1)) * bounds.height;
    const maxHealth = Math.round(config.sharkHealth * (1 + index * 0.08));

    sharks.push({
      id: `shark-${config.level}-${index}`,
      kind: index === 0 ? "basic" : "difficult",
      pos: {
        x: bounds.width - 70 - index * 12,
        y,
      },
      vel: { x: -config.sharkSpeed, y: 0 },
      radius: 23 + Math.min(8, Math.floor(config.level / 18)),
      health: maxHealth,
      maxHealth,
      speed: config.sharkSpeed,
      attackCooldown: 1.35 + index * 0.55,
      attackRate: config.sharkAttackRate,
      attackRadius: 112 + Math.min(38, config.level * 0.42),
    });
  }

  return sharks;
};

const closestFish = (shark: Shark, fish: Fish[]): Fish | undefined => {
  const alive = aliveFish(fish);

  return alive.reduce<Fish | undefined>((closest, candidate) => {
    if (!closest) {
      return candidate;
    }

    return distance(candidate.pos, shark.pos) < distance(closest.pos, shark.pos) ? candidate : closest;
  }, undefined);
};

export const updateSharks = (sharks: Shark[], fish: Fish[], bounds: Bounds, dt: number): void => {
  const center = schoolCenter(fish);

  for (const shark of sharks) {
    if (shark.health <= 0) {
      continue;
    }

    const targetFish = closestFish(shark, fish);
    const target = targetFish?.pos ?? center;
    const desired = scale(normalize(subtract(target, shark.pos)), shark.speed);
    shark.vel = limit(
      {
        x: shark.vel.x * 0.88 + desired.x * 0.22,
        y: shark.vel.y * 0.88 + desired.y * 0.22,
      },
      shark.speed,
    );
    shark.pos = {
      x: clamp(shark.pos.x + shark.vel.x * dt, shark.radius, bounds.width - shark.radius),
      y: clamp(shark.pos.y + shark.vel.y * dt, shark.radius, bounds.height - shark.radius),
    };
  }
};
