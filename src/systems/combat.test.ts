import { describe, expect, it } from "vitest";
import { aliveFish, applyContactSharkBite, applySharkAttack, hasLivingSchoolFish, summarizeAliveFishCounts } from "./combat";
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

  it("marks caught fish for a short visual fade without a movement pause", () => {
    const fish = makeFish(10);
    const shark = makeShark();

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);
    const caught = fish.filter((candidate) => candidate.caught);

    expect(result.caught).toBeGreaterThan(0);
    expect(caught.every((candidate) => candidate.caughtTimer && candidate.caughtTimer > 0)).toBe(true);
    expect(shark.feedingRecovery).toBe(0);
  });

  it("summarizes only alive visible fish for run counters", () => {
    const fish = makeFish(6);
    fish[1].typeId = "salmon";
    fish[1].className = "normal";
    fish[2].caught = true;
    fish[2].caughtTimer = 0.18;

    const summary = summarizeAliveFishCounts(fish);

    expect(aliveFish(fish)).toHaveLength(5);
    expect(summary.fishCount).toBe(5);
    expect(summary.fishCounts.tilapia).toBe(4);
    expect(summary.fishCounts.salmon).toBe(1);
  });

  it("keeps the school alive when tilapia are gone but recruited fish remain", () => {
    const fish = makeFish(4);
    fish[0].caught = true;
    fish[1].caught = true;
    fish[2].caught = true;
    fish[3].typeId = "parrotfish";
    fish[3].className = "fast";
    fish[3].health = 2;
    fish[3].maxHealth = 2;

    const summary = summarizeAliveFishCounts(fish);

    expect(summary.fishCount).toBe(1);
    expect(summary.fishCounts.tilapia ?? 0).toBe(0);
    expect(summary.fishCounts.parrotfish).toBe(1);
    expect(hasLivingSchoolFish(fish)).toBe(true);
  });

  it("catches seven to eight fish from a 40 fish round-one school", () => {
    const fish = makeFish(40);
    const shark = makeShark();

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(result.caught).toBeGreaterThanOrEqual(7);
    expect(result.caught).toBeLessThanOrEqual(8);
  });

  it("uses fish body size to make near-edge bites reliable", () => {
    const fish = makeFish(20);
    fish.forEach((candidate, index) => {
      candidate.pos = { x: 400 + index * 3, y: 100 };
    });
    fish[10].pos = { x: 116, y: 100 };
    fish[10].radius = 6;
    const shark = makeShark({
      pos: { x: 100, y: 100 },
      attackRadius: 8,
    });

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(result.caught).toBe(1);
    expect(fish[10].caught).toBe(true);
  });

  it("catches roughly 18 percent of starting available fish", () => {
    const fish = makeFish(50);
    const shark = makeShark();

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(result.caught).toBe(9);
    expect(fish.filter((candidate) => candidate.caught)).toHaveLength(9);
  });

  it("does not catch fish when no fish are near the shark attack area", () => {
    const fish = makeFish(20);
    fish.forEach((candidate, index) => {
      candidate.pos = { x: 500 + index * 2, y: 300 };
    });
    const shark = makeShark({
      pos: { x: 100, y: 100 },
      attackRadius: 24,
    });

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(result.caught).toBe(0);
    expect(fish.every((candidate) => !candidate.caught)).toBe(true);
  });

  it("lets evasive recruited fish dodge a selected shark attack", () => {
    const fish = makeFish(1);
    fish[0].typeId = "parrotfish";
    fish[0].className = "fast";
    fish[0].health = 1;
    fish[0].maxHealth = 1;
    fish[0].evasion = 1;
    const shark = makeShark();
    const rolls = [0, 0.5];

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => rolls.shift() ?? 0.5);

    expect(result.caught).toBe(0);
    expect(fish[0].caught).toBe(false);
  });

  it("lets protection and catch resistance keep tank fish swimming longer", () => {
    const fish = makeFish(1);
    fish[0].typeId = "grouper";
    fish[0].className = "tank";
    fish[0].health = 2;
    fish[0].maxHealth = 2;
    fish[0].protection = 0.35;
    const shark = makeShark();

    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => 0.9, {
      catchResistance: 0.25,
    });

    expect(result.caught).toBe(0);
    expect(fish[0].caught).toBe(false);
    expect(fish[0].health).toBeGreaterThan(0);
  });

  it("uses a more readable caught fade window for shark-caused removals", () => {
    const fish = makeFish(10);
    const shark = makeShark();

    applySharkAttack(fish, shark, createLevelConfig(1), () => 0);

    expect(fish.find((candidate) => candidate.caught)?.caughtTimer).toBeGreaterThanOrEqual(0.5);
  });

  it("damages support fish before catching them", () => {
    const fish = makeFish(4);
    fish.forEach((candidate, index) => {
      candidate.pos = { x: 145 + index * 8, y: 100 };
    });
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

    const rolls: number[] = [0, 1, 1, 1, 1];
    const result = applySharkAttack(fish, shark, createLevelConfig(1), () => rolls.shift() ?? 1);

    expect(result.damagedSupport).toBe(1);
    expect(result.caught).toBe(0);
    expect(fish.at(-1)?.health).toBeLessThan(100);
    expect(fish.at(-1)?.caught).toBe(false);
  });

  it("uses contact bites when a shark visually overlaps the closest fish", () => {
    const fish = makeFish(4);
    fish[0].pos = { x: 122, y: 100 };
    fish[1].pos = { x: 260, y: 100 };
    fish[2].pos = { x: 280, y: 100 };
    fish[3].pos = { x: 300, y: 100 };
    const shark = makeShark({
      pos: { x: 100, y: 100 },
      hunger: 20,
      contactCooldown: 0,
    });

    const result = applyContactSharkBite(fish, shark, createLevelConfig(1));

    expect(result.caught).toBe(1);
    expect(result.damagedSupport).toBe(0);
    expect(fish[0].caught).toBe(true);
    expect(fish[1].caught).toBe(false);
    expect(shark.hunger).toBeGreaterThan(20);
    expect(shark.feedingRecovery).toBe(0);
    expect(shark.contactCooldown).toBeGreaterThan(0);
  });

  it("does not contact-bite again while the shark cooldown is active", () => {
    const fish = makeFish(4);
    fish[0].pos = { x: 105, y: 100 };
    const shark = makeShark({
      pos: { x: 100, y: 100 },
      contactCooldown: 0.2,
    });

    const result = applyContactSharkBite(fish, shark, createLevelConfig(1));

    expect(result.caught).toBe(0);
    expect(fish.every((candidate) => !candidate.caught)).toBe(true);
  });
});
