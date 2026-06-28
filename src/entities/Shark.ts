import type { Bounds, Fish, LevelConfig, Shark } from "../game/types";
import { aliveFish, schoolCenter } from "../systems/combat";
import { centerOf, clamp, distance, limit, normalize, scale, subtract } from "../systems/vector";

const sharkStats = {
  basic: {
    radius: 24,
    health: 1,
    hunger: 1,
    speed: 1,
    acceleration: 0.22,
    drain: 1,
    attackRadius: 1,
  },
  fast: {
    radius: 21,
    health: 0.78,
    hunger: 0.82,
    speed: 1.28,
    acceleration: 0.3,
    drain: 1.08,
    attackRadius: 0.92,
  },
  center: {
    radius: 25,
    health: 1.05,
    hunger: 1.05,
    speed: 0.96,
    acceleration: 0.2,
    drain: 0.98,
    attackRadius: 1.06,
  },
  barracuda: {
    radius: 16,
    health: 0.62,
    hunger: 0.68,
    speed: 1.34,
    acceleration: 0.34,
    drain: 1.18,
    attackRadius: 0.82,
  },
  eel: {
    radius: 18,
    health: 0.74,
    hunger: 0.9,
    speed: 1.08,
    acceleration: 0.24,
    drain: 1.03,
    attackRadius: 1.12,
  },
} satisfies Record<Shark["kind"], Record<"radius" | "health" | "hunger" | "speed" | "acceleration" | "drain" | "attackRadius", number>>;

export const createSharks = (config: LevelConfig, bounds: Bounds): Shark[] => {
  const sharks: Shark[] = [];

  for (let index = 0; index < config.sharkCount; index += 1) {
    const y = ((index + 1) / (config.sharkCount + 1)) * bounds.height;
    const kind = config.sharkTypes[index] ?? "basic";
    const stats = sharkStats[kind];
    const maxHealth = Math.round(config.sharkHealth * stats.health * (1 + index * 0.06));
    const maxHunger = Math.round((28 + config.level * 0.44) * stats.hunger);
    const radius = stats.radius + Math.min(7, Math.floor(config.level / 20));

    sharks.push({
      id: `shark-${config.level}-${index}`,
      kind,
      pos: {
        x: bounds.width - 70 - index * 12,
        y,
      },
      vel: { x: -config.sharkSpeed * stats.speed, y: 0 },
      radius,
      health: maxHealth,
      maxHealth,
      hunger: maxHunger,
      maxHunger,
      hungerDrain: (0.88 + config.level * 0.012) * stats.drain,
      speed: config.sharkSpeed * stats.speed,
      acceleration: stats.acceleration,
      attackCooldown: 1.35 + index * 0.55,
      attackRate: config.sharkAttackRate,
      attackRadius: (112 + Math.min(38, config.level * 0.42)) * stats.attackRadius,
      starved: false,
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

const isolatedFish = (fish: Fish[]): Fish | undefined => {
  const alive = aliveFish(fish);
  const center = schoolCenter(alive);

  return alive.reduce<Fish | undefined>((outer, candidate) => {
    if (!outer) {
      return candidate;
    }

    return distance(candidate.pos, center) > distance(outer.pos, center) ? candidate : outer;
  }, undefined);
};

export const targetForShark = (shark: Shark, fish: Fish[]) => {
  if (shark.kind === "center") {
    return centerOf(aliveFish(fish).map((candidate) => candidate.pos));
  }

  if (shark.kind === "barracuda") {
    return isolatedFish(fish)?.pos ?? schoolCenter(fish);
  }

  return closestFish(shark, fish)?.pos ?? schoolCenter(fish);
};

export type SharkSummary = {
  kind: Shark["kind"];
  count: number;
  totalHunger: number;
  maxHunger: number;
};

export const summarizeSharks = (sharks: Shark[]): SharkSummary[] => {
  const summaries = new Map<Shark["kind"], SharkSummary>();

  for (const shark of sharks.filter((candidate) => candidate.health > 0 || !candidate.starved)) {
    const current = summaries.get(shark.kind) ?? {
      kind: shark.kind,
      count: 0,
      totalHunger: 0,
      maxHunger: 0,
    };
    current.count += 1;
    current.totalHunger += shark.hunger;
    current.maxHunger += shark.maxHunger;
    summaries.set(shark.kind, current);
  }

  return Array.from(summaries.values());
};

export const updateSharks = (sharks: Shark[], fish: Fish[], bounds: Bounds, dt: number): void => {
  for (const shark of sharks) {
    if (shark.health <= 0 || shark.starved) {
      continue;
    }

    const target = targetForShark(shark, fish);
    const desired = scale(normalize(subtract(target, shark.pos)), shark.speed);
    shark.vel = limit(
      {
        x: shark.vel.x * (1 - shark.acceleration) + desired.x * shark.acceleration,
        y: shark.vel.y * (1 - shark.acceleration) + desired.y * shark.acceleration,
      },
      shark.speed,
    );
    shark.pos = {
      x: clamp(shark.pos.x + shark.vel.x * dt, shark.radius, bounds.width - shark.radius),
      y: clamp(shark.pos.y + shark.vel.y * dt, shark.radius, bounds.height - shark.radius),
    };
  }
};
