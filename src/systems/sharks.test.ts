import { describe, expect, it } from "vitest";
import { createSchool } from "../entities/School";
import { createSharks, isActiveShark, isDefeatedShark, isVisibleShark, summarizeSharks, targetForShark, updateSharks } from "../entities/Shark";
import { applySharkAttack, drainSharkHunger } from "./combat";
import { createLevelConfig } from "./levels";
import { distance } from "./vector";

describe("shark hunger and predator types", () => {
  it("starves sharks over time and marks them stopped", () => {
    const [shark] = createSharks(createLevelConfig(1), { width: 600, height: 400 });

    drainSharkHunger([shark], 999);

    expect(shark.hunger).toBe(0);
    expect(shark.starved).toBe(true);
  });

  it("restores shark hunger when attacks catch fish", () => {
    const config = createLevelConfig(1);
    const school = createSchool(20, 0, { width: 600, height: 400 });
    const [shark] = createSharks(config, { width: 600, height: 400 });
    shark.pos = { x: 250, y: 200 };
    shark.hunger = 20;

    const result = applySharkAttack(school, shark, config, () => 0);

    expect(result.caught).toBeGreaterThan(0);
    expect(shark.hunger).toBeGreaterThan(20);
  });

  it("creates at least three shark types by midgame", () => {
    const sharks = createSharks(createLevelConfig(24), { width: 600, height: 400 });
    const kinds = new Set(sharks.map((shark) => shark.kind));

    expect(kinds.has("basic")).toBe(true);
    expect(kinds.has("fast")).toBe(true);
    expect(kinds.has("center")).toBe(true);
  });

  it("uses distinct targeting logic for Norman, Steezy, Bill, and Grog", () => {
  const school = createSchool(0, 0, { width: 600, height: 400 });
  school.push(
    {
      id: "near",
      kind: "basic",
      typeId: "tilapia",
      className: "common",
      pos: { x: 120, y: 120 },
      vel: { x: 0, y: 0 },
      radius: 4,
      maxSpeed: 1.8,
      health: 1,
      maxHealth: 1,
      threatened: false,
      caught: false,
    },
    {
      id: "outer",
      kind: "basic",
      typeId: "tilapia",
      className: "common",
      pos: { x: 420, y: 310 },
      vel: { x: 0, y: 0 },
      radius: 4,
      maxSpeed: 1.8,
      health: 1,
      maxHealth: 1,
      threatened: false,
      caught: false,
    },
    {
      id: "cluster",
      kind: "basic",
      typeId: "tilapia",
      className: "common",
      pos: { x: 130, y: 125 },
      vel: { x: 0, y: 0 },
      radius: 4,
      maxSpeed: 1.8,
      health: 1,
      maxHealth: 1,
      threatened: false,
      caught: false,
    },
  );

  const [norman] = createSharks({ ...createLevelConfig(12), sharkTypes: ["basic"] }, { width: 600, height: 400 });
  const [steezy] = createSharks({ ...createLevelConfig(12), sharkTypes: ["fast"] }, { width: 600, height: 400 });
  const [bill] = createSharks({ ...createLevelConfig(12), sharkTypes: ["center"] }, { width: 600, height: 400 });
  const [grog] = createSharks({ ...createLevelConfig(12), sharkTypes: ["barracuda"] }, { width: 600, height: 400 });

  expect(targetForShark(grog, school).x).toBeCloseTo((120 + 420 + 130) / 3);
  expect(targetForShark(grog, school).y).toBeCloseTo((120 + 310 + 125) / 3);

  expect(targetForShark(grog, school).x).toBeCloseTo((120 + 420 + 130) / 3);
expect(targetForShark(grog, school).y).toBeCloseTo((120 + 310 + 125) / 3);

expect(targetForShark(bill, school)).toEqual({ x: 420, y: 310 });
expect(targetForShark(norman, school)).toEqual({ x: 120, y: 120 });
expect(targetForShark(steezy, school)).toEqual({ x: 120, y: 120 });
});
  it("summarizes active enemy composition by shark type", () => {
    const sharks = createSharks(createLevelConfig(24), { width: 600, height: 400 });
    const summary = summarizeSharks(sharks);

    expect(summary.some((entry) => entry.kind === "fast" && entry.count >= 1)).toBe(true);
    expect(summary.every((entry) => entry.totalHunger > 0)).toBe(true);
  });

  it("summarizes shark health and hunger with safe positive max values", () => {
    const sharks = createSharks(createLevelConfig(24), { width: 600, height: 400 });
    sharks[0].health = sharks[0].maxHealth / 2;
    sharks[0].hunger = sharks[0].maxHunger / 2;

    const summary = summarizeSharks(sharks);

    expect(summary.every((entry) => entry.totalHealth >= 0)).toBe(true);
    expect(summary.every((entry) => entry.maxHealth > 0)).toBe(true);
    expect(summary.every((entry) => entry.totalHunger >= 0)).toBe(true);
    expect(summary.every((entry) => entry.maxHunger > 0)).toBe(true);
  });

  it("keeps health-dead sharks hidden even if round-end starvation changes other sharks", () => {
    const sharks = createSharks({ ...createLevelConfig(12), sharkCount: 2 }, { width: 600, height: 400 });
    const dead = sharks[0];
    const survivor = sharks[1];

    dead.health = 0;
    dead.starved = true;
    survivor.health = survivor.maxHealth;
    survivor.starved = true;

    expect(isVisibleShark(dead)).toBe(false);
    expect(isDefeatedShark(dead)).toBe(true);
    expect(isVisibleShark(survivor)).toBe(true);
    expect(isActiveShark(survivor)).toBe(false);
    expect(summarizeSharks(sharks).reduce((sum, entry) => sum + entry.count, 0)).toBe(1);
  });

  it("does not summarize fully dead sharks while another shark remains active", () => {
    const sharks = createSharks({ ...createLevelConfig(12), sharkCount: 2 }, { width: 600, height: 400 });
    sharks[0].health = 0;
    sharks[0].starved = false;

    const summary = summarizeSharks(sharks);

    expect(isVisibleShark(sharks[0])).toBe(false);
    expect(isActiveShark(sharks[1])).toBe(true);
    expect(summary.reduce((sum, entry) => sum + entry.count, 0)).toBe(1);
  });

  it("keeps sharks faster than basic fish by default", () => {
    const school = createSchool(1, 0, { width: 600, height: 400 });
    const [shark] = createSharks(createLevelConfig(1), { width: 600, height: 400 });

    updateSharks([shark], school, { width: 600, height: 400 }, 1);

    expect(shark.speed).toBeGreaterThan(school[0].maxSpeed);
  });

  it("keeps faster fish lively without outrunning round-one sharks", () => {
    const school = createSchool(1, 0, { width: 600, height: 400 });
    const [shark] = createSharks(createLevelConfig(1), { width: 600, height: 400 });

    expect(school[0].maxSpeed).toBeGreaterThan(1.6);
    expect(shark.speed).toBeGreaterThan(school[0].maxSpeed);
  });

  it("lets artifact modifiers slow sharks without changing level config", () => {
    const config = createLevelConfig(1);
    const base = createSharks(config, { width: 600, height: 400 })[0];
    const slowed = createSharks(config, { width: 600, height: 400 }, { sharkSpeedMultiplier: 0.9 })[0];

    expect(slowed.speed).toBeLessThan(base.speed);
    expect(Math.hypot(slowed.vel.x, slowed.vel.y)).toBeLessThan(Math.hypot(base.vel.x, base.vel.y));
  });

  it("steers sharks back into the arena when they hit an edge", () => {
    const school = createSchool(1, 0, { width: 600, height: 400 });
    school[0].pos = { x: 4, y: 4 };
    const [shark] = createSharks(createLevelConfig(1), { width: 600, height: 400 });
    shark.pos = { x: shark.radius, y: shark.radius };
    shark.vel = { x: -shark.speed, y: -shark.speed };

    updateSharks([shark], school, { width: 600, height: 400 }, 1);

    expect(shark.pos.x).toBeGreaterThanOrEqual(shark.radius);
    expect(shark.pos.y).toBeGreaterThanOrEqual(shark.radius);
    expect(shark.vel.x).toBeGreaterThan(0);
    expect(shark.vel.y).toBeGreaterThan(0);
  });

  it("continues at full speed during bite feedback", () => {
    const school = createSchool(1, 0, { width: 600, height: 400 });
    const [shark] = createSharks(createLevelConfig(1), { width: 600, height: 400 });
    shark.feedingRecovery = 0.08;
    const startPos = { ...shark.pos };

    updateSharks([shark], school, { width: 600, height: 400 }, 1, 0.1);

    expect(shark.feedingRecovery).toBe(0);
    expect(distance(shark.pos, school[0].pos)).toBeLessThan(distance(startPos, school[0].pos));
    expect(Math.hypot(shark.vel.x, shark.vel.y)).toBeGreaterThan(shark.speed * 0.8);
  });

  it("keeps shark sprite facing stable on tiny horizontal jitter", () => {
    const school = createSchool(1, 0, { width: 600, height: 400 });
    const [shark] = createSharks(createLevelConfig(1), { width: 600, height: 400 });
    shark.facingX = -1;
    shark.vel = { x: 0.03, y: shark.speed };
    shark.pos = { x: 300, y: 160 };
    school[0].pos = { x: 300, y: 220 };

    updateSharks([shark], school, { width: 600, height: 400 }, 0.1, 0.016);

    expect(shark.facingX).toBe(-1);
  });
});
