import type { Bounds, Fish, Shark, Vector } from "../game/types";
import { add, clamp, distance, normalize, scale, subtract } from "./vector";

export const FISH_NEURAL_STEERING_ENABLED = true;

export type FishSteeringFeatures = {
  bias: number;
  typeEvasion: number;
  typeGroup: number;
  velocityX: number;
  velocityY: number;
  schoolDirectionX: number;
  schoolDirectionY: number;
  neighborDensity: number;
  sharkRelativeX: number;
  sharkRelativeY: number;
  sharkVelocityX: number;
  sharkVelocityY: number;
  sharkSpeed: number;
  closingDanger: number;
  sharkForwardX: number;
  sharkForwardY: number;
  dangerPath: number;
  lungeRelativeX: number;
  lungeRelativeY: number;
  leftWall: number;
  rightWall: number;
  topWall: number;
  bottomWall: number;
  edgePressureX: number;
  edgePressureY: number;
};

export type FishSteeringOutputs = {
  avoidShark: Vector;
  sidestepSharkPath: Vector;
  avoidWall: Vector;
  regroupToSchool: Vector;
  separateFromCrowd: Vector;
  speedUrgency: number;
};

const typeWeights: Record<string, { evasion: number; group: number }> = {
  tilapia: { evasion: 0.86, group: 1.18 },
  salmon: { evasion: 1, group: 1 },
  parrotfish: { evasion: 1.28, group: 0.9 },
  "mahi-mahi": { evasion: 1.14, group: 0.82 },
  grouper: { evasion: 0.68, group: 1.08 },
};

const nearestShark = (fish: Fish, sharks: Shark[]): Shark | undefined =>
  sharks
    .filter((shark) => shark.health > 0 && !shark.starved)
    .sort((left, right) => distance(left.pos, fish.pos) - distance(right.pos, fish.pos))[0];

const wallFeature = (gap: number, margin: number): number =>
  clamp((margin - gap) / margin, 0, 1);

const edgePressureFor = (fish: Fish, bounds: Bounds): Vector => {
  const margin = 92;
  return {
    x: wallFeature(fish.pos.x, margin) - wallFeature(bounds.width - fish.pos.x, margin),
    y: wallFeature(fish.pos.y, margin) - wallFeature(bounds.height - fish.pos.y, margin),
  };
};

export const fishSteeringFeatureVector = (
  fish: Fish,
  sharks: Shark[],
  bounds: Bounds,
  schoolCenter: Vector,
  neighborDensity: number,
  threatRadius: number,
): FishSteeringFeatures => {
  const shark = nearestShark(fish, sharks);
  const weights = typeWeights[fish.typeId] ?? { evasion: 1, group: 1 };
  const schoolDirection = normalize(subtract(schoolCenter, fish.pos));
  const edgePressure = edgePressureFor(fish, bounds);

  if (!shark) {
    return {
      bias: 1,
      typeEvasion: weights.evasion,
      typeGroup: weights.group,
      velocityX: fish.vel.x / Math.max(1, fish.maxSpeed),
      velocityY: fish.vel.y / Math.max(1, fish.maxSpeed),
      schoolDirectionX: schoolDirection.x,
      schoolDirectionY: schoolDirection.y,
      neighborDensity: clamp(neighborDensity / 8, 0, 1),
      sharkRelativeX: 0,
      sharkRelativeY: 0,
      sharkVelocityX: 0,
      sharkVelocityY: 0,
      sharkSpeed: 0,
      closingDanger: 0,
      sharkForwardX: 0,
      sharkForwardY: 0,
      dangerPath: 0,
      lungeRelativeX: 0,
      lungeRelativeY: 0,
      leftWall: wallFeature(fish.pos.x, 92),
      rightWall: wallFeature(bounds.width - fish.pos.x, 92),
      topWall: wallFeature(fish.pos.y, 92),
      bottomWall: wallFeature(bounds.height - fish.pos.y, 92),
      edgePressureX: edgePressure.x,
      edgePressureY: edgePressure.y,
    };
  }

  const relative = subtract(fish.pos, shark.pos);
  const sharkSpeed = Math.hypot(shark.vel.x, shark.vel.y);
  const sharkForward = sharkSpeed > 0.05 ? normalize(shark.vel) : normalize(subtract(fish.pos, shark.pos));
  const toFish = normalize(relative);
  const closingDanger = clamp((shark.vel.x * toFish.x + shark.vel.y * toFish.y) / Math.max(1, shark.speed), 0, 1);
  const forward = relative.x * sharkForward.x + relative.y * sharkForward.y;
  const lateral = relative.x * -sharkForward.y + relative.y * sharkForward.x;
  const laneRange = Math.min(threatRadius, shark.attackRadius + 34);
  const laneWidth = shark.radius + fish.radius * 5;
  const dangerPath = forward > 0 && forward < laneRange && Math.abs(lateral) < laneWidth
    ? (1 - forward / laneRange) * (1 - Math.abs(lateral) / laneWidth)
    : 0;
  const predicted = add(shark.pos, scale(sharkForward, shark.attackRadius * 0.68));
  const lungeRelative = subtract(fish.pos, predicted);

  return {
    bias: 1,
    typeEvasion: weights.evasion,
    typeGroup: weights.group,
    velocityX: fish.vel.x / Math.max(1, fish.maxSpeed),
    velocityY: fish.vel.y / Math.max(1, fish.maxSpeed),
    schoolDirectionX: schoolDirection.x,
    schoolDirectionY: schoolDirection.y,
    neighborDensity: clamp(neighborDensity / 8, 0, 1),
    sharkRelativeX: clamp(relative.x / threatRadius, -1, 1),
    sharkRelativeY: clamp(relative.y / threatRadius, -1, 1),
    sharkVelocityX: clamp(shark.vel.x / Math.max(1, shark.speed), -1, 1),
    sharkVelocityY: clamp(shark.vel.y / Math.max(1, shark.speed), -1, 1),
    sharkSpeed: clamp(sharkSpeed / Math.max(1, shark.speed), 0, 1.4),
    closingDanger,
    sharkForwardX: sharkForward.x,
    sharkForwardY: sharkForward.y,
    dangerPath,
    lungeRelativeX: clamp(lungeRelative.x / threatRadius, -1, 1),
    lungeRelativeY: clamp(lungeRelative.y / threatRadius, -1, 1),
    leftWall: wallFeature(fish.pos.x, 92),
    rightWall: wallFeature(bounds.width - fish.pos.x, 92),
    topWall: wallFeature(fish.pos.y, 92),
    bottomWall: wallFeature(bounds.height - fish.pos.y, 92),
    edgePressureX: edgePressure.x,
    edgePressureY: edgePressure.y,
  };
};

export const runFishSteeringModel = (features: FishSteeringFeatures): FishSteeringOutputs => {
  const sharkDanger = clamp(features.closingDanger * 0.7 + features.dangerPath * 1.15 + features.sharkSpeed * 0.16, 0, 1.6);
  const avoidShark = {
    x: features.sharkRelativeX * sharkDanger * features.typeEvasion * 0.92,
    y: features.sharkRelativeY * sharkDanger * features.typeEvasion * 0.92,
  };
  const side = features.sharkRelativeX * -features.sharkForwardY + features.sharkRelativeY * features.sharkForwardX >= 0 ? 1 : -1;
  const sidestepSharkPath = {
    x: -features.sharkForwardY * side * features.dangerPath * features.typeEvasion * 1.1,
    y: features.sharkForwardX * side * features.dangerPath * features.typeEvasion * 1.1,
  };
  const avoidWall = {
    x: features.edgePressureX * (1.75 + sharkDanger * 0.35),
    y: features.edgePressureY * (1.75 + sharkDanger * 0.35),
  };
  const regroupStrength = Math.max(0, 0.42 * features.typeGroup - features.neighborDensity * 0.18 - sharkDanger * 0.16);
  const regroupToSchool = {
    x: features.schoolDirectionX * regroupStrength,
    y: features.schoolDirectionY * regroupStrength,
  };
  const separateFromCrowd = {
    x: -features.schoolDirectionX * features.neighborDensity * 0.24,
    y: -features.schoolDirectionY * features.neighborDensity * 0.24,
  };

  return {
    avoidShark,
    sidestepSharkPath,
    avoidWall,
    regroupToSchool,
    separateFromCrowd,
    speedUrgency: clamp(0.2 + sharkDanger * 0.5 + Math.abs(features.edgePressureX) * 0.18 + Math.abs(features.edgePressureY) * 0.18, 0, 1),
  };
};

export const steeringVectorFromModel = (features: FishSteeringFeatures): Vector => {
  const outputs = runFishSteeringModel(features);
  return scale(
    add(add(add(add(outputs.avoidShark, outputs.sidestepSharkPath), outputs.avoidWall), outputs.regroupToSchool), outputs.separateFromCrowd),
    0.88 + outputs.speedUrgency * 0.28,
  );
};
