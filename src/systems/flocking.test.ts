import { describe, expect, it } from "vitest";
import { updateFlocking } from "./flocking";
import type { Fish, Shark } from "../game/types";

describe("updateFlocking", () => {
  it("marks fish threatened and pushes them away from a nearby shark", () => {
    const fish: Fish[] = [
      {
        id: "fish-1",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 100, y: 100 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
      {
        id: "fish-2",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 112, y: 101 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
    ];
    const shark: Shark = {
      id: "shark-1",
      kind: "basic",
      pos: { x: 75, y: 100 },
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
      attackRadius: 140,
      starved: false,
    };

    updateFlocking(fish, [shark], {
      width: 400,
      height: 300,
      threatRadius: 120,
      dt: 1,
    });

    expect(fish[0].threatened).toBe(true);
    expect(fish[0].vel.x).toBeGreaterThan(0);
    expect(fish[0].pos.x).toBeGreaterThan(100);
  });

  it("pushes fish out of corners instead of letting corners become safe traps", () => {
    const fish: Fish[] = [
      {
        id: "corner-fish",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 5, y: 5 },
        vel: { x: -1, y: -1 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
    ];

    updateFlocking(fish, [], {
      width: 400,
      height: 300,
      threatRadius: 120,
      dt: 1,
    });

    expect(fish[0].vel.x).toBeGreaterThan(0);
    expect(fish[0].vel.y).toBeGreaterThan(0);
    expect(fish[0].pos.x).toBeGreaterThan(5);
    expect(fish[0].pos.y).toBeGreaterThan(5);
  });

  it("repairs invalid fish position and velocity instead of propagating NaN", () => {
    const fish: Fish[] = [
      {
        id: "bad-fish",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: Number.NaN, y: Number.POSITIVE_INFINITY },
        vel: { x: Number.NaN, y: Number.NEGATIVE_INFINITY },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
    ];

    updateFlocking(fish, [], {
      width: 400,
      height: 300,
      threatRadius: 120,
      dt: 1,
    });

    expect(Number.isFinite(fish[0].pos.x)).toBe(true);
    expect(Number.isFinite(fish[0].pos.y)).toBe(true);
    expect(Number.isFinite(fish[0].vel.x)).toBe(true);
    expect(Number.isFinite(fish[0].vel.y)).toBe(true);
  });

  it("softly pushes overlapping fish apart without breaking the school", () => {
    const fish: Fish[] = [
      {
        id: "fish-a",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 140, y: 140 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
      {
        id: "fish-b",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 142, y: 140 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
    ];

    updateFlocking(fish, [], {
      width: 400,
      height: 300,
      threatRadius: 120,
      dt: 1,
    });

    expect(Math.abs(fish[1].pos.x - fish[0].pos.x)).toBeGreaterThan(9);
    expect(fish.every((candidate) => Math.hypot(candidate.vel.x, candidate.vel.y) <= candidate.maxSpeed)).toBe(true);
  });

  it("keeps sprite facing stable on tiny horizontal velocity jitter", () => {
    const fish: Fish[] = [
      {
        id: "jitter-fish",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 180, y: 160 },
        vel: { x: -0.03, y: 0.6 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
        facingX: 1,
      },
    ];

    updateFlocking(fish, [], {
      width: 400,
      height: 300,
      threatRadius: 120,
      dt: 1,
    });

    expect(fish[0].facingX).toBe(1);
  });

  it("adds a shared movement intention for large schools that are not fleeing", () => {
    const fish: Fish[] = Array.from({ length: 30 }, (_, index) => ({
      id: `large-school-${index}`,
      kind: "basic",
      typeId: "tilapia",
      className: "common",
      pos: {
        x: 140 + (index % 6) * 9,
        y: 130 + Math.floor(index / 6) * 9,
      },
      vel: {
        x: index % 2 === 0 ? -0.2 : 0.2,
        y: index % 3 === 0 ? -0.15 : 0.15,
      },
      radius: 4,
      maxSpeed: 2,
      health: 1,
      maxHealth: 1,
      threatened: false,
      caught: false,
    }));

    updateFlocking(fish, [], {
      width: 500,
      height: 360,
      threatRadius: 120,
      dt: 1,
      schoolIntent: { x: 1, y: 0.1 },
    });

    const averageVelocity = fish.reduce(
      (sum, candidate) => ({
        x: sum.x + candidate.vel.x,
        y: sum.y + candidate.vel.y,
      }),
      { x: 0, y: 0 },
    );

    expect(averageVelocity.x / fish.length).toBeGreaterThan(0.18);
    expect(fish.every((candidate) => Math.hypot(candidate.vel.x, candidate.vel.y) <= candidate.maxSpeed)).toBe(true);
  });

  it("lets the ocean current nudge fish without overpowering their max speed", () => {
    const fish: Fish[] = [
      {
        id: "current-fish",
        kind: "basic",
        typeId: "salmon",
        className: "normal",
        pos: { x: 180, y: 160 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 3,
        maxHealth: 3,
        threatened: false,
        caught: false,
      },
    ];

    updateFlocking(fish, [], {
      width: 400,
      height: 300,
      threatRadius: 120,
      dt: 1,
      currentAt: () => ({ x: 0.45, y: 0.1 }),
    });

    expect(fish[0].vel.x).toBeGreaterThan(0);
    expect(fish[0].pos.x).toBeGreaterThan(180);
    expect(Math.hypot(fish[0].vel.x, fish[0].vel.y)).toBeLessThanOrEqual(fish[0].maxSpeed);
  });
});
