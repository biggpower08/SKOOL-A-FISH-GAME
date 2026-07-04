import type { Bounds, Fish, Shark, Vector } from "../game/types";
import { FISH_NEURAL_STEERING_ENABLED, fishSteeringFeatureVector, steeringVectorFromModel } from "./fishSteeringModel";
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
const LOCAL_THREAT_AWARENESS = 94;
const CHAIN_REACTION_BONUS = 34;
const PARROTFISH_SUPPORT_RADIUS = 88;
const PARROTFISH_AWARENESS_BONUS = 24;
const PARROTFISH_SPEED_BONUS = 0.08;

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

const parrotfishSupportLevel = (fish: Fish, school: Fish[]): number =>
  school.some(
    (candidate) =>
      !candidate.caught &&
      candidate.typeId === "parrotfish" &&
      distance(candidate.pos, fish.pos) <= PARROTFISH_SUPPORT_RADIUS,
  )
    ? 1
    : 0;

const localAwarenessRadius = (fish: Fish, school: Fish[], threatRadius: number): number => {
  const roleBonus = fish.typeId === "parrotfish" ? 14 : fish.typeId === "mahi-mahi" ? 8 : 0;
  const supportBonus = parrotfishSupportLevel(fish, school) * PARROTFISH_AWARENESS_BONUS;
  return Math.min(threatRadius, LOCAL_THREAT_AWARENESS + roleBonus + supportBonus);
};

const isDirectlyThreatened = (fish: Fish, sharks: Shark[], awarenessRadius: number): boolean =>
  sharks.some((shark) => shark.health > 0 && !shark.starved && distance(fish.pos, shark.pos) <= awarenessRadius);

const escape = (fish: Fish, sharks: Shark[], awarenessRadius: number, chainAlarm: boolean): Vector => {
  let threatened = false;
  const reactionRadius = chainAlarm ? awarenessRadius + CHAIN_REACTION_BONUS : awarenessRadius;
  const flee = sharks.reduce<Vector>((sum, shark) => {
    if (shark.health <= 0 || shark.starved) {
      return sum;
    }

    const gap = distance(fish.pos, shark.pos);

    if (gap > reactionRadius || gap === 0) {
      return sum;
    }

    threatened = true;
    const alarmScale = gap <= awarenessRadius ? 1 : 0.38;
    const strength = ((reactionRadius - gap) / reactionRadius) * alarmScale;
    return add(sum, scale(normalize(subtract(fish.pos, shark.pos)), strength));
  }, zero());

  fish.threatened = threatened;
  return flee;
};

const dangerPathEscape = (fish: Fish, sharks: Shark[], threatRadius: number): Vector =>
  sharks.reduce<Vector>((sum, shark) => {
    if (shark.health <= 0 || shark.starved) {
      return sum;
    }

    const sharkSpeed = Math.hypot(shark.vel.x, shark.vel.y);

    if (sharkSpeed < 0.2) {
      return sum;
    }

    const direction = normalize(shark.vel);
    const toFish = subtract(fish.pos, shark.pos);
    const forward = toFish.x * direction.x + toFish.y * direction.y;
    const laneRange = Math.min(threatRadius, shark.attackRadius + 28);

    if (forward <= 0 || forward > laneRange) {
      return sum;
    }

    const lateral = toFish.x * -direction.y + toFish.y * direction.x;
    const laneWidth = shark.radius + fish.radius * 4.5;

    if (Math.abs(lateral) > laneWidth) {
      return sum;
    }

    const side = lateral >= 0 ? 1 : -1;
    const roleMultiplier = fish.typeId === "mahi-mahi" ? 1.28 : fish.typeId === "parrotfish" ? 1.08 : fish.typeId === "grouper" ? 0.68 : 1;
    const urgency = (1 - forward / laneRange) * (1 - Math.abs(lateral) / laneWidth);
    const perpendicular = { x: -direction.y * side, y: direction.x * side };

    return add(sum, scale(perpendicular, urgency * roleMultiplier * 1.6));
  }, zero());

const boundaryPush = (fish: Fish, bounds: Bounds): Vector => {
  const margin = 86;
  const cornerMargin = 112;
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
    return add(push, scale(normalize(subtract(arenaCenter, fish.pos)), 1.9));
  }

  return push;
};

const openWaterEscape = (fish: Fish, sharks: Shark[], bounds: Bounds, active: boolean): Vector => {
  if (!active) {
    return zero();
  }

  const aliveSharks = sharks.filter((shark) => shark.health > 0 && !shark.starved);

  if (aliveSharks.length === 0) {
    return zero();
  }

  const directions: Vector[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    normalize({ x: 1, y: 1 }),
    normalize({ x: 1, y: -1 }),
    normalize({ x: -1, y: 1 }),
    normalize({ x: -1, y: -1 }),
  ];
  const centerPoint = { x: bounds.width / 2, y: bounds.height / 2 };
  const maxCenterDistance = Math.hypot(bounds.width / 2, bounds.height / 2);
  const step = 72;

  let bestDirection = zero();
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const direction of directions) {
    const target = {
      x: fish.pos.x + direction.x * step,
      y: fish.pos.y + direction.y * step,
    };
    const edgePenalty =
      target.x < 48 || target.x > bounds.width - 48 || target.y < 48 || target.y > bounds.height - 48 ? 86 : 0;
    const sharkDistance = Math.min(...aliveSharks.map((shark) => distance(target, shark.pos)));
    const centerBonus = (1 - Math.min(1, distance(target, centerPoint) / maxCenterDistance)) * 42;
    const score = sharkDistance + centerBonus - edgePenalty;

    if (score > bestScore) {
      bestScore = score;
      bestDirection = direction;
    }
  }

  return scale(bestDirection, 0.42);
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
  const livingSchool = school.filter((fish) => !fish.caught);
  const schoolCentroid =
    livingSchool.length > 0
      ? scale(
          livingSchool.reduce<Vector>(
            (sum, fish) =>
              add(sum, {
                x: finiteOr(fish.pos.x, options.width / 2),
                y: finiteOr(fish.pos.y, options.height / 2),
              }),
            zero(),
          ),
          1 / livingSchool.length,
        )
      : { x: options.width / 2, y: options.height / 2 };

  for (const fish of livingSchool) {
    sanitizeFishMotion(fish, options);
  }

  const directlyThreatenedIds = new Set(
    livingSchool
      .filter((fish) => isDirectlyThreatened(fish, sharks, localAwarenessRadius(fish, livingSchool, options.threatRadius)))
      .map((fish) => fish.id),
  );

  for (const fish of school) {
    if (fish.caught) {
      continue;
    }

    sanitizeFishMotion(fish, options);
    const near = around(fish, school);
    const supportLevel = parrotfishSupportLevel(fish, livingSchool);
    const awarenessRadius = localAwarenessRadius(fish, livingSchool, options.threatRadius);
    const chainAlarm = near.some((candidate) => directlyThreatenedIds.has(candidate.id));
    const crowding = localCrowding(fish, near);
    const sep = avoid(fish, near);
    const ali = align(fish, near);
    const coh = center(fish, near, crowding);
    const crowd = crowding >= 5 ? crowdPressure(fish, near) : zero();
    const flee = escape(fish, sharks, awarenessRadius, chainAlarm);
    const danger = dangerPathEscape(fish, sharks, options.threatRadius);
    const openWater = openWaterEscape(fish, sharks, options, fish.threatened || chainAlarm);
    const edge = boundaryPush(fish, options);
    const neural = FISH_NEURAL_STEERING_ENABLED
      ? steeringVectorFromModel(fishSteeringFeatureVector(fish, sharks, options, schoolCentroid, crowding, options.threatRadius))
      : zero();
    const intent = fish.threatened ? zero() : scale(sharedIntent, LARGE_SCHOOL_INTENT_STRENGTH);
    const current = options.currentAt ? options.currentAt(fish.pos) : zero();
    const supportedMaxSpeed = fish.maxSpeed * (1 + supportLevel * PARROTFISH_SPEED_BONUS);
    let steering = fish.vel;

    for (const vector of [sep, crowd, ali, coh, intent, scale(flee, 4.8), danger, openWater, scale(edge, 1.45), neural]) {
      steering = add(steering, vector);
    }

    fish.vel = limit(add(steering, scale(current, 0.38)), supportedMaxSpeed);
    fish.pos = {
      x: clamp(fish.pos.x + fish.vel.x * options.dt, fish.radius, options.width - fish.radius),
      y: clamp(fish.pos.y + fish.vel.y * options.dt, fish.radius, options.height - fish.radius),
    };
    updateFacing(fish);
  }

  applySoftBodySeparation(school, options);
};
