import { describe, expect, it } from "vitest";
import type { Fish, Shark } from "../game/types";
import { fishSteeringFeatureVector, runFishSteeringModel, steeringVectorFromModel } from "./fishSteeringModel";

const fish = (overrides: Partial<Fish> = {}): Fish => ({
  id: "fish",
  kind: "basic",
  typeId: "parrotfish",
  className: "fast",
  pos: { x: 84, y: 100 },
  vel: { x: 0, y: 0 },
  radius: 4,
  maxSpeed: 2.35,
  health: 2,
  maxHealth: 2,
  threatened: false,
  caught: false,
  ...overrides,
});

const shark = (overrides: Partial<Shark> = {}): Shark => ({
  id: "shark",
  kind: "basic",
  pos: { x: 40, y: 100 },
  vel: { x: 2.3, y: 0 },
  radius: 24,
  health: 100,
  maxHealth: 100,
  hunger: 60,
  maxHunger: 60,
  hungerDrain: 1,
  speed: 2.3,
  acceleration: 0.22,
  attackCooldown: 0.2,
  attackRate: 4,
  attackRadius: 140,
  starved: false,
  ...overrides,
});

describe("fish steering model", () => {
  it("builds a deterministic feature vector from walls, school, and shark motion", () => {
    const features = fishSteeringFeatureVector(fish(), [shark()], { width: 400, height: 300 }, { x: 160, y: 130 }, 4, 120);

    expect(features.bias).toBe(1);
    expect(features.typeEvasion).toBeGreaterThan(1);
    expect(features.schoolDirectionX).toBeGreaterThan(0);
    expect(features.sharkVelocityX).toBeGreaterThan(0);
    expect(features.closingDanger).toBeGreaterThan(0);
    expect(features.dangerPath).toBeGreaterThan(0);
    expect(features.lungeRelativeX).toBeLessThan(0);
    expect(features.leftWall).toBeGreaterThan(0);
  });

  it("outputs baseline wall avoidance even when no shark exists", () => {
    const features = fishSteeringFeatureVector(fish({ pos: { x: 10, y: 280 } }), [], { width: 400, height: 300 }, { x: 180, y: 150 }, 0, 120);
    const outputs = runFishSteeringModel(features);

    expect(outputs.avoidWall.x).toBeGreaterThan(0);
    expect(outputs.avoidWall.y).toBeLessThan(0);
    expect(outputs.speedUrgency).toBeGreaterThan(0);
  });

  it("sidesteps a predicted shark lunge path", () => {
    const features = fishSteeringFeatureVector(fish({ pos: { x: 130, y: 104 } }), [shark()], { width: 400, height: 300 }, { x: 170, y: 140 }, 1, 120);
    const steering = steeringVectorFromModel(features);

    expect(Math.abs(steering.y)).toBeGreaterThan(0.2);
    expect(steering.x).toBeGreaterThan(-0.4);
  });
});
