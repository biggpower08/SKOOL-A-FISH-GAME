import type { Bounds, Fish, Shark, Vector } from "../game/types";
import { add, clamp, distance, limit, normalize, scale, subtract } from "./vector";

export type FlockingOptions = Bounds & {
  threatRadius: number;
  dt: number;
  schoolIntent?: Vector;
  currentAt?: (position: Vector) => Vector;
};

const NEIGHBOR_RADIUS = 74;
const DESIRED_SEPARATION = 20;
const CROWD_RADIUS = 32;
const SOFT_BODY_PADDING = 12;
const FACING_VELOCITY_THRESHOLD = 0.18;
const LARGE_SCHOOL_THRESHOLD = 20;
const LARGE_SCHOOL_INTENT_STRENGTH = 0.7;

const zero = (): Vector => ({ x: 0, y: 0 });

const finiteOr = (value: number, fallback: number): number => (Number.isFinite(value) ? value : fallback);

const sanitizeFishMotion = (fish: Fish, bounds: Bounds): void => {
  fish.pos = {
    x: clamp(finiteOr(fish.pos.x, bounds.width / 2), fish.radius, bounds.width - fish.radius),
    y: clamp(finiteOr(fish.pos.y, bounds.height / 2), fish.radius, bounds.height - fish.radius),
  };
  fish.vel = {
    x: finiteOr(fish.vel.x, 0),
    y: finiteOr(fish.vel.y, 0),
  };
};

const around = (fish: Fish, school: Fish[]): Fish[] =>
  school.filter((candidate) => candidate !== fish && !candidate.caught && distance(candidate.pos, fish.pos) <= NEIGHBOR_RADIUS);

const avoid = (fish: Fish, near: Fish[]): Vector => {
  const steering = near.reduce<Vector>((sum, candidate) => {
    const gap = distance(fish.pos, candidate.pos);

    const desiredGap = Math.max(DESIRED_SEPARATION, fish.radius + candidate.radius + SOFT_BODY_PADDING);

    if (gap === 0 || gap > desiredGap) {
      return sum;
    }

    const push = scale(normalize(subtract(fish.pos, candidate.pos)), (desiredGap - gap) / desiredGap);
    return add(sum, push);
  }, zero());

  return scale(steering, 1.05);
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

const localCrowding = (fish: Fish, near: Fish[]): number =>
  near.filter((candidate) => distance(candidate.pos, fish.pos) < CROWD_RADIUS).length;

const center = (fish: Fish, near: Fish[], crowding: number): Vector => {
  if (near.length === 0) {
    return zero();
  }

  const centroid = scale(
    near.reduce<Vector>((sum, candidate) => add(sum, candidate.pos), zero()),
    1 / near.length,
  );

  const crowdedCohesion = crowding >= 5 ? 0.005 : 0.012;
  return scale(subtract(centroid, fish.pos), crowdedCohesion);
};

const crowdPressure = (fish: Fish, near: Fish[]): Vector => {
  const pressure = near.reduce<Vector>((sum, candidate) => {
    const gap = distance(fish.pos, candidate.pos);

    if (gap === 0 || gap >= CROWD_RADIUS) {
      return sum;
    }

    return add(sum, scale(normalize(subtract(fish.pos, candidate.pos)), (CROWD_RADIUS - gap) / CROWD_RADIUS));
  }, zero());

  return scale(pressure, 0.38);
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
  const margin = 72;
  const cornerMargin = 96;
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

  const nearHorizontalEdge = fish.pos.x < cornerMargin || fish.pos.x > bounds.width - cornerMargin;
  const nearVerticalEdge = fish.pos.y < cornerMargin || fish.pos.y > bounds.height - cornerMargin;

  if (nearHorizontalEdge && nearVerticalEdge) {
    const arenaCenter = { x: bounds.width / 2, y: bounds.height / 2 };
    return add(push, scale(normalize(subtract(arenaCenter, fish.pos)), 1.4));
  }

  return push;
};

const applySoftBodySeparation = (school: Fish[], bounds: Bounds): void => {
  const alive = school.filter((fish) => !fish.caught);

  for (let leftIndex = 0; leftIndex < alive.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < alive.length; rightIndex += 1) {
      const left = alive[leftIndex];
      const right = alive[rightIndex];

      if (left.threatened || right.threatened) {
        continue;
      }

      const gap = distance(left.pos, right.pos);
      const minGap = left.radius + right.radius + SOFT_BODY_PADDING;

      if (gap >= minGap) {
        continue;
      }

      const direction =
        gap > 0.001
          ? normalize(subtract(right.pos, left.pos))
          : normalize({
              x: rightIndex % 2 === 0 ? 1 : -1,
              y: leftIndex % 2 === 0 ? 0.35 : -0.35,
            });
      const push = (minGap - gap) * 0.3;

      left.pos = {
        x: clamp(left.pos.x - direction.x * push, left.radius, bounds.width - left.radius),
        y: clamp(left.pos.y - direction.y * push, left.radius, bounds.height - left.radius),
      };
      right.pos = {
        x: clamp(right.pos.x + direction.x * push, right.radius, bounds.width - right.radius),
        y: clamp(right.pos.y + direction.y * push, right.radius, bounds.height - right.radius),
      };
    }
  }
};

const updateFacing = (fish: Fish): void => {
  if (Math.abs(fish.vel.x) <= FACING_VELOCITY_THRESHOLD) {
    return;
  }

  fish.facingX = fish.vel.x < 0 ? -1 : 1;
};

const largeSchoolIntent = (school: Fish[], options: FlockingOptions): Vector => {
  const alive = school.filter((fish) => !fish.caught);

  if (alive.length < LARGE_SCHOOL_THRESHOLD) {
    return zero();
  }

  if (options.schoolIntent && Math.hypot(options.schoolIntent.x, options.schoolIntent.y) > 0.01) {
    return normalize(options.schoolIntent);
  }

  const averageVelocity = alive.reduce<Vector>((sum, fish) => add(sum, fish.vel), zero());

  if (Math.hypot(averageVelocity.x, averageVelocity.y) > 0.05) {
    return normalize(averageVelocity);
  }

  return { x: 1, y: 0.12 };
};

export const updateFlocking = (school: Fish[], sharks: Shark[], options: FlockingOptions): void => {
  const sharedIntent = largeSchoolIntent(school, options);

  for (const fish of school) {
    if (fish.caught) {
      continue;
    }

    sanitizeFishMotion(fish, options);
    const near = around(fish, school);
    const crowding = localCrowding(fish, near);
    const sep = avoid(fish, near);
    const ali = align(fish, near);
    const coh = center(fish, near, crowding);
    const crowd = crowding >= 5 ? crowdPressure(fish, near) : zero();
    const flee = escape(fish, sharks, options.threatRadius);
    const edge = boundaryPush(fish, options);
    const intent = fish.threatened ? zero() : scale(sharedIntent, LARGE_SCHOOL_INTENT_STRENGTH);
    const current = options.currentAt ? options.currentAt(fish.pos) : zero();

    fish.vel = limit(
      add(add(add(add(add(add(add(add(fish.vel, sep), crowd), ali), coh), intent), scale(flee, 4.8)), scale(edge, 1.35)), scale(current, 0.38)),
      fish.maxSpeed,
    );
    fish.pos = {
      x: clamp(fish.pos.x + fish.vel.x * options.dt, fish.radius, options.width - fish.radius),
      y: clamp(fish.pos.y + fish.vel.y * options.dt, fish.radius, options.height - fish.radius),
    };
    updateFacing(fish);
  }

  applySoftBodySeparation(school, options);
};
