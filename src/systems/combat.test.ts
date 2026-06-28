import { describe, expect, it } from "vitest";
import { applySharkAttack } from "./combat";
import { createLevelConfig } from "./levels";
import type { Fish, Shark } from "../game/types";

const makeFish = (count: number): Fish[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `fish-${index}`,
    kind: "basic",
    typeId: "tilapia",
    className: "common",
    pos: { x: 100 + index, y: 100 },
    vel: { x: 0, y: 0 },
    radius: 4,
    maxSpeed: 1.8,
    health: 1,
    maxHealth: 1,
    threatened: false,
    caught: false,
  }));

const makeShark = (overrides: Partial<Shark> = {}): Shark => ({
  id: "shark-1",
  kind: "basic",
  pos: { x: 120, y: 100 },
  vel: { x: 0, y: 0 },
  radius: 24,
  health: 100,
  maxHealth: 100,
  hunger: 60,
  maxHunger: 60,
  hungerDrain: 1,
  speed: 2.2,
  acceleration: 0.22,
  attackCooldown: 0,
  attackRate: 4,
  attackRadius: 150,
  starved: false,
  ...overrides,
});

describe("applySharkAttack", () => {
  it("catches four fish from a 20 fish round-one school", () => {
    const fish = makeFish(20);
    const shark = makeShark();

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(result.caught).toBe(4);
    expect(fish.filter((candidate) => candidate.caught)).toHaveLength(4);
  });

  it("catches roughly 18 percent of starting available fish", () => {
    const fish = makeFish(50);
    const shark = makeShark();

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(result.caught).toBe(9);
    expect(fish.filter((candidate) => candidate.caught)).toHaveLength(9);
  });

  it("damages support fish before catching them", () => {
    const fish = makeFish(4);
    fish.push({
      id: "support-1",
      kind: "support",
      typeId: "support",
      className: "support",
      pos: { x: 100, y: 100 },
      vel: { x: 0, y: 0 },
      radius: 7,
      maxSpeed: 1.5,
      health: 100,
      maxHealth: 100,
      threatened: false,
      caught: false,
    });
    const shark = makeShark({
      pos: { x: 100, y: 100 },
    });

    const rolls: number[] = [1, 1, 1, 1, 0];
    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => rolls.shift() ?? 1);

    expect(result.damagedSupport).toBe(1);
    expect(result.caught).toBe(0);
    expect(fish.at(-1)?.health).toBeLessThan(100);
    expect(fish.at(-1)?.caught).toBe(false);
  });
});
