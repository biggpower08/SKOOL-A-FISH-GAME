import type { Bounds, Fish, Shark, Vector } from "../game/types";
import { add, clamp, distance, limit, normalize, scale, subtract } from "./vector";

export type FlockingOptions = Bounds & {
  threatRadius: number;
  dt: number;
};

const NEIGHBOR_RADIUS = 74;
const DESIRED_SEPARATION = 17;

const zero = (): Vector => ({ x: 0, y: 0 });

const around = (fish: Fish, school: Fish[]): Fish[] =>
  school.filter((candidate) => candidate !== fish && !candidate.caught && distance(candidate.pos, fish.pos) <= NEIGHBOR_RADIUS);

const avoid = (fish: Fish, near: Fish[]): Vector => {
  const steering = near.reduce<Vector>((sum, candidate) => {
    const gap = distance(fish.pos, candidate.pos);

    if (gap === 0 || gap > DESIRED_SEPARATION) {
      return sum;
    }

    const push = scale(normalize(subtract(fish.pos, candidate.pos)), (DESIRED_SEPARATION - gap) / DESIRED_SEPARATION);
    return add(sum, push);
  }, zero());

  return scale(steering, 0.9);
};

const align = (fish: Fish, near: Fish[]): Vector => {
  if (near.length === 0) {
    return zero();
  }

  const average = scale(
    near.reduce<Vector>((sum, candidate) => add(sum, candidate.vel), zero()),
    1 / near.length,
  );

  return scale(subtract(average, fish.vel), 0.05);
};

const center = (fish: Fish, near: Fish[]): Vector => {
  if (near.length === 0) {
    return zero();
  }

  const centroid = scale(
    near.reduce<Vector>((sum, candidate) => add(sum, candidate.pos), zero()),
    1 / near.length,
  );

  return scale(subtract(centroid, fish.pos), 0.012);
};

const escape = (fish: Fish, sharks: Shark[], threatRadius: number): Vector => {
  let threatened = false;
  const flee = sharks.reduce<Vector>((sum, shark) => {
    if (shark.health <= 0) {
      return sum;
    }

    const gap = distance(fish.pos, shark.pos);

    if (gap > threatRadius || gap === 0) {
      return sum;
    }

    threatened = true;
    const strength = (threatRadius - gap) / threatRadius;
    return add(sum, scale(normalize(subtract(fish.pos, shark.pos)), strength));
  }, zero());

  fish.threatened = threatened;
  return flee;
};

const boundaryPush = (fish: Fish, bounds: Bounds): Vector => {
  const margin = 46;
  const push = zero();

  if (fish.pos.x < margin) {
    push.x += (margin - fish.pos.x) / margin;
  }

  if (fish.pos.x > bounds.width - margin) {
    push.x -= (fish.pos.x - (bounds.width - margin)) / margin;
  }

  if (fish.pos.y < margin) {
    push.y += (margin - fish.pos.y) / margin;
  }

  if (fish.pos.y > bounds.height - margin) {
    push.y -= (fish.pos.y - (bounds.height - margin)) / margin;
  }

  return push;
};

export const updateFlocking = (school: Fish[], sharks: Shark[], options: FlockingOptions): void => {
  for (const fish of school) {
    if (fish.caught) {
      continue;
    }

    const near = around(fish, school);
    const sep = avoid(fish, near);
    const ali = align(fish, near);
    const coh = center(fish, near);
    const flee = escape(fish, sharks, options.threatRadius);
    const edge = boundaryPush(fish, options);

    fish.vel = limit(
      add(add(add(add(add(fish.vel, sep), ali), coh), scale(flee, 3.6)), scale(edge, 0.75)),
      fish.maxSpeed,
    );
    fish.pos = {
      x: clamp(fish.pos.x + fish.vel.x * options.dt, fish.radius, options.width - fish.radius),
      y: clamp(fish.pos.y + fish.vel.y * options.dt, fish.radius, options.height - fish.radius),
    };
  }
};
