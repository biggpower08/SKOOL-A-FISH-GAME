import type { Bounds, Fish, FishBehaviorMode, Shark, Vector } from "../game/types";
import { FISH_NEURAL_STEERING_ENABLED, fishSteeringFeatureVector, steeringVectorFromModel } from "./fishSteeringModel";
import { add, clamp, distance, limit, normalize, scale, subtract } from "./vector";

export type FlockingOptions = Bounds & {
  threatRadius: number;
  dt: number;
  schoolIntent?: Vector;
  kelpGoal?: { pos: Vector; radius: number } | null;
  currentAt?: (position: Vector) => Vector;
};

const DESIRED_SEPARATION = 20;
const CROWD_RADIUS = 32;
const REPULSION_ZONE = 24;
const ORIENTATION_ZONE = 52;
const ATTRACTION_ZONE = 78;
const SOFT_BODY_PADDING = 12;
const FACING_VELOCITY_THRESHOLD = 0.18;
const LARGE_SCHOOL_THRESHOLD = 20;
const LARGE_SCHOOL_INTENT_STRENGTH = 0.52;
const LOCAL_THREAT_AWARENESS = 86;
const CHAIN_REACTION_BONUS = 31;
const PARROTFISH_SUPPORT_RADIUS = 88;
const PARROTFISH_AWARENESS_BONUS = 24;
const PARROTFISH_SPEED_BONUS = 0.08;

type BehaviorWeights = {
  separation: number;
  alignment: number;
  cohesion: number;
  intent: number;
  flee: number;
  danger: number;
  openWater: number;
  edge: number;
  current: number;
  wander: number;
};

export const behaviorWeights: Record<FishBehaviorMode, BehaviorWeights> = {
  forage: { separation: 1, alignment: 0.45, cohesion: 0.55, intent: 1.4, flee: 0, danger: 0.2, openWater: 0, edge: 0.45, current: 0.34, wander: 0.16 },
  school: { separation: 1, alignment: 0.8, cohesion: 0.75, intent: 0.5, flee: 0, danger: 0.25, openWater: 0, edge: 0.55, current: 0.36, wander: 0.1 },
  alert: { separation: 1.15, alignment: 0.65, cohesion: 0.5, intent: 0.15, flee: 1.1, danger: 0.85, openWater: 0.6, edge: 0.8, current: 0.32, wander: 0.04 },
  flee: { separation: 1.45, alignment: 0.2, cohesion: 0.15, intent: 0, flee: 2.4, danger: 1.25, openWater: 1.5, edge: 1.25, current: 0.22, wander: 0 },
  recover: { separation: 1, alignment: 0.7, cohesion: 0.8, intent: 0.9, flee: 0.25, danger: 0.25, openWater: 0.2, edge: 0.7, current: 0.34, wander: 0.08 },
};

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

type NeighborZones = {
  repulsion: Fish[];
  orientation: Fish[];
  attraction: Fish[];
  all: Fish[];
};

const zoneScaleForFish = (fish: Fish): number => (fish.typeId === "grouper" ? 1.14 : fish.typeId === "mahi-mahi" ? 0.94 : fish.typeId === "tilapia" ? 1.05 : 1);

export const neighborZonesFor = (fish: Fish, school: Fish[]): NeighborZones => {
  const zoneScale = zoneScaleForFish(fish);
  const repulsionLimit = Math.max(REPULSION_ZONE * zoneScale, fish.radius * 2 + SOFT_BODY_PADDING);
  const orientationLimit = ORIENTATION_ZONE * zoneScale;
  const attractionLimit = ATTRACTION_ZONE * zoneScale;
  const zones: NeighborZones = {
    repulsion: [],
    orientation: [],
    attraction: [],
    all: [],
  };

  for (const candidate of school) {
    if (candidate === fish || candidate.caught) {
      continue;
    }

    const gap = distance(candidate.pos, fish.pos);

    if (gap > attractionLimit) {
      continue;
    }

    zones.all.push(candidate);

    if (gap <= repulsionLimit) {
      zones.repulsion.push(candidate);
    } else if (gap <= orientationLimit) {
      zones.orientation.push(candidate);
    } else {
      zones.attraction.push(candidate);
    }
  }

  return zones;
};

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

const align = (fish: Fish, zone: Fish[]): Vector => {
  if (zone.length === 0) {
    return zero();
  }

  const average = scale(
    zone.reduce<Vector>((sum, candidate) => add(sum, candidate.vel), zero()),
    1 / zone.length,
  );

  return scale(subtract(average, fish.vel), 0.05);
};

const localCrowding = (fish: Fish, near: Fish[]): number =>
  near.filter((candidate) => distance(candidate.pos, fish.pos) < CROWD_RADIUS).length;

const center = (fish: Fish, zone: Fish[], crowding: number): Vector => {
  if (zone.length === 0) {
    return zero();
  }

  const centroid = scale(
    zone.reduce<Vector>((sum, candidate) => add(sum, candidate.pos), zero()),
    1 / zone.length,
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

const isInSharkAttackLane = (fish: Fish, sharks: Shark[], threatRadius: number): boolean =>
  sharks.some((shark) => {
    if (shark.health <= 0 || shark.starved) {
      return false;
    }

    const sharkSpeed = Math.hypot(shark.vel.x, shark.vel.y);

    if (sharkSpeed < 0.2) {
      return false;
    }

    const direction = normalize(shark.vel);
    const toFish = subtract(fish.pos, shark.pos);
    const forward = toFish.x * direction.x + toFish.y * direction.y;
    const laneRange = Math.min(threatRadius, shark.attackRadius + 28);

    if (forward <= 0 || forward > laneRange) {
      return false;
    }

    const lateral = toFish.x * -direction.y + toFish.y * direction.x;
    return Math.abs(lateral) <= shark.radius + fish.radius * 4.5;
  });

export type FishBehaviorModeInput = {
  fish: Fish;
  sharks: Shark[];
  school: Fish[];
  threatRadius: number;
  kelpGoal?: { pos: Vector; radius: number } | null;
  previousMode?: FishBehaviorMode;
};

export const selectFishBehaviorMode = ({ fish, sharks, school, threatRadius, kelpGoal, previousMode }: FishBehaviorModeInput): FishBehaviorMode => {
  const awarenessRadius = localAwarenessRadius(fish, school, threatRadius);
  const activeSharks = sharks.filter((shark) => shark.health > 0 && !shark.starved);
  const nearestShark = activeSharks.length > 0 ? Math.min(...activeSharks.map((shark) => distance(fish.pos, shark.pos))) : Number.POSITIVE_INFINITY;
  const directThreat = nearestShark <= awarenessRadius || isInSharkAttackLane(fish, activeSharks, threatRadius);

  if (directThreat) {
    return "flee";
  }

  if ((previousMode === "flee" || previousMode === "alert") && nearestShark > awarenessRadius + 34) {
    return "recover";
  }

  if (nearestShark <= Math.min(threatRadius + 42, awarenessRadius + 96)) {
    return "alert";
  }

  if (kelpGoal && distance(fish.pos, kelpGoal.pos) > kelpGoal.radius * 0.9) {
    return "forage";
  }

  return "school";
};

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

const wanderFor = (fish: Fish): Vector => {
  const seed = fish.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return normalize({
    x: Math.sin(seed * 12.9898 + fish.pos.y * 0.018),
    y: Math.cos(seed * 7.233 + fish.pos.x * 0.015),
  });
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
    const zones = neighborZonesFor(fish, school);
    const supportLevel = parrotfishSupportLevel(fish, livingSchool);
    const awarenessRadius = localAwarenessRadius(fish, livingSchool, options.threatRadius);
    const chainAlarm = zones.all.some((candidate) => directlyThreatenedIds.has(candidate.id));
    const crowding = localCrowding(fish, zones.all);
    const mode = selectFishBehaviorMode({
      fish,
      sharks,
      school: livingSchool,
      threatRadius: options.threatRadius,
      kelpGoal: options.kelpGoal,
      previousMode: fish.behaviorMode,
    });
    const weights = behaviorWeights[mode];
    const repulsionActive = zones.repulsion.length > 0;
    const sep = avoid(fish, repulsionActive ? zones.repulsion : zones.all);
    const ali = repulsionActive ? zero() : align(fish, zones.orientation);
    const coh = repulsionActive ? zero() : center(fish, zones.attraction.length > 0 ? zones.attraction : zones.orientation, crowding);
    const crowd = crowding >= 5 ? crowdPressure(fish, zones.all) : zero();
    const flee = escape(fish, sharks, awarenessRadius, chainAlarm);
    const danger = dangerPathEscape(fish, sharks, options.threatRadius);
    const openWater = openWaterEscape(fish, sharks, options, fish.threatened || chainAlarm);
    const edge = boundaryPush(fish, options);
    const neural = FISH_NEURAL_STEERING_ENABLED
      ? steeringVectorFromModel(fishSteeringFeatureVector(fish, sharks, options, schoolCentroid, crowding, options.threatRadius))
      : zero();
    const intent = mode === "flee" ? zero() : scale(sharedIntent, LARGE_SCHOOL_INTENT_STRENGTH);
    const current = options.currentAt ? options.currentAt(fish.pos) : zero();
    const wander = wanderFor(fish);
    const supportedMaxSpeed = fish.maxSpeed * (1 + supportLevel * PARROTFISH_SPEED_BONUS);
    let steering = fish.vel;

    for (const vector of [
      scale(sep, weights.separation),
      scale(crowd, weights.separation),
      scale(ali, weights.alignment),
      scale(coh, weights.cohesion),
      scale(intent, weights.intent),
      scale(flee, 2 * weights.flee),
      scale(danger, weights.danger),
      scale(openWater, weights.openWater),
      scale(edge, weights.edge),
      scale(wander, weights.wander),
      neural,
    ]) {
      steering = add(steering, vector);
    }

    fish.behaviorMode = mode;
    fish.vel = limit(add(steering, scale(current, weights.current)), supportedMaxSpeed);
    fish.pos = {
      x: clamp(fish.pos.x + fish.vel.x * options.dt, fish.radius, options.width - fish.radius),
      y: clamp(fish.pos.y + fish.vel.y * options.dt, fish.radius, options.height - fish.radius),
    };
    updateFacing(fish);
  }

  applySoftBodySeparation(school, options);
};
