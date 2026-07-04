import { describe, expect, it } from "vitest";
import { updateFlocking } from "./flocking";
import flockingSource from "./flocking.ts?raw";
import type { Fish, Shark } from "../game/types";

describe("updateFlocking", () => {
  const withinMaxSpeed = (fish: Fish): boolean => Math.hypot(fish.vel.x, fish.vel.y) <= fish.maxSpeed + 0.000001;

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
    expect(fish.every(withinMaxSpeed)).toBe(true);
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
    expect(fish.every(withinMaxSpeed)).toBe(true);
  });

  it("keeps shared school intent modest so kelp goals guide rather than yank the school", () => {
    expect(flockingSource).toContain("const LARGE_SCHOOL_INTENT_STRENGTH = 0.52");
    expect(flockingSource).toContain("const LOCAL_THREAT_AWARENESS = 86");
    expect(flockingSource).toContain("const CHAIN_REACTION_BONUS = 31");
  });

  it("opens dense large schools without exploding them apart", () => {
    const fish: Fish[] = Array.from({ length: 54 }, (_, index) => ({
      id: `dense-school-${index}`,
      kind: "basic",
      typeId: index % 9 === 0 ? "salmon" : "tilapia",
      className: index % 9 === 0 ? "normal" : "common",
      pos: {
        x: 210 + (index % 9) * 5,
        y: 150 + Math.floor(index / 9) * 5,
      },
      vel: { x: 0, y: 0 },
      radius: index % 9 === 0 ? 4.5 : 4,
      maxSpeed: index % 9 === 0 ? 2.22 : 2.12,
      health: index % 9 === 0 ? 3 : 1,
      maxHealth: index % 9 === 0 ? 3 : 1,
      threatened: false,
      caught: false,
    }));

    const averageNearestGap = (): number =>
      fish.reduce((sum, candidate) => {
        const nearest = Math.min(
          ...fish.filter((other) => other !== candidate).map((other) => Math.hypot(other.pos.x - candidate.pos.x, other.pos.y - candidate.pos.y)),
        );

        return sum + nearest;
      }, 0) / fish.length;

    const startingGap = averageNearestGap();

    for (let tick = 0; tick < 6; tick += 1) {
      updateFlocking(fish, [], {
        width: 500,
        height: 360,
        threatRadius: 120,
        dt: 0.8,
        schoolIntent: { x: 1, y: 0.1 },
      });
    }

    expect(averageNearestGap()).toBeGreaterThan(startingGap + 7);
    expect(fish.every(withinMaxSpeed)).toBe(true);
    expect(fish.every((candidate) => candidate.pos.x > 110 && candidate.pos.x < 380)).toBe(true);
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

  it("steers fish sideways out of a shark attack path", () => {
    const fish: Fish[] = [
      {
        id: "lane-fish",
        kind: "basic",
        typeId: "salmon",
        className: "normal",
        pos: { x: 160, y: 103 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2.2,
        health: 3,
        maxHealth: 3,
        threatened: false,
        caught: false,
      },
    ];
    const shark: Shark = {
      id: "lane-shark",
      kind: "basic",
      pos: { x: 100, y: 100 },
      vel: { x: 2.2, y: 0 },
      radius: 24,
      health: 100,
      maxHealth: 100,
      hunger: 60,
      maxHunger: 60,
      hungerDrain: 1,
      speed: 2.2,
      acceleration: 0.22,
      attackCooldown: 0.2,
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

    expect(fish[0].vel.y).toBeGreaterThan(0.35);
  });

  it("does not pull low-danger fish after a retreating shark", () => {
    const fish: Fish[] = Array.from({ length: 30 }, (_, index) => ({
      id: `calm-fish-${index}`,
      kind: "basic",
      typeId: "tilapia",
      className: "common",
      pos: {
        x: 210 + (index % 6) * 10,
        y: 145 + Math.floor(index / 6) * 10,
      },
      vel: { x: 0, y: 0 },
      radius: 4,
      maxSpeed: 2.1,
      health: 1,
      maxHealth: 1,
      threatened: false,
      caught: false,
    }));
    const shark: Shark = {
      id: "retreating-shark",
      kind: "basic",
      pos: { x: 370, y: 170 },
      vel: { x: 2.2, y: 0 },
      radius: 24,
      health: 100,
      maxHealth: 100,
      hunger: 60,
      maxHunger: 60,
      hungerDrain: 1,
      speed: 2.2,
      acceleration: 0.22,
      attackCooldown: 1,
      attackRate: 4,
      attackRadius: 140,
      starved: false,
    };

    updateFlocking(fish, [shark], {
      width: 500,
      height: 360,
      threatRadius: 86,
      dt: 1,
      schoolIntent: { x: -1, y: 0 },
    });

    const averageVelocityX = fish.reduce((sum, candidate) => sum + candidate.vel.x, 0) / fish.length;

    expect(averageVelocityX).toBeLessThan(0);
    expect(fish.filter((candidate) => candidate.threatened)).toHaveLength(0);
  });

  it("keeps shark awareness local while letting nearby fish pass along alarm", () => {
    const fish: Fish[] = [
      {
        id: "front-fish",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 160, y: 150 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
      {
        id: "neighbor-fish",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 196, y: 151 },
        vel: { x: 0, y: 0 },
        radius: 4,
        maxSpeed: 2,
        health: 1,
        maxHealth: 1,
        threatened: false,
        caught: false,
      },
      {
        id: "calm-back-fish",
        kind: "basic",
        typeId: "tilapia",
        className: "common",
        pos: { x: 286, y: 150 },
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
      id: "local-shark",
      kind: "basic",
      pos: { x: 80, y: 150 },
      vel: { x: 0, y: 0 },
      radius: 24,
      health: 100,
      maxHealth: 100,
      hunger: 60,
      maxHunger: 60,
      hungerDrain: 1,
      speed: 2.2,
      acceleration: 0.22,
      attackCooldown: 1,
      attackRate: 4,
      attackRadius: 140,
      starved: false,
    };

    updateFlocking(fish, [shark], {
      width: 420,
      height: 320,
      threatRadius: 150,
      dt: 1,
    });

    expect(fish[0].threatened).toBe(true);
    expect(fish[1].threatened).toBe(true);
    expect(fish[2].threatened).toBe(false);
    expect(fish[0].vel.x).toBeGreaterThan(fish[1].vel.x);
  });

  it("lets nearby Parrotfish extend danger sensing and movement support", () => {
    const fish: Fish[] = [
      {
        id: "supported-salmon",
        kind: "basic",
        typeId: "salmon",
        className: "normal",
        pos: { x: 210, y: 145 },
        vel: { x: 0, y: 0 },
        radius: 4.5,
        maxSpeed: 2.22,
        health: 3,
        maxHealth: 3,
        threatened: false,
        caught: false,
      },
      {
        id: "support-parrotfish",
        kind: "basic",
        typeId: "parrotfish",
        className: "support",
        pos: { x: 214, y: 156 },
        vel: { x: 0, y: 0 },
        radius: 4.25,
        maxSpeed: 2.34,
        health: 2,
        maxHealth: 2,
        threatened: false,
        caught: false,
      },
      {
        id: "unsupported-salmon",
        kind: "basic",
        typeId: "salmon",
        className: "normal",
        pos: { x: 210, y: 250 },
        vel: { x: 0, y: 0 },
        radius: 4.5,
        maxSpeed: 2.22,
        health: 3,
        maxHealth: 3,
        threatened: false,
        caught: false,
      },
    ];
    const shark: Shark = {
      id: "support-check-shark",
      kind: "basic",
      pos: { x: 105, y: 145 },
      vel: { x: 0, y: 0 },
      radius: 24,
      health: 100,
      maxHealth: 100,
      hunger: 60,
      maxHunger: 60,
      hungerDrain: 1,
      speed: 2.2,
      acceleration: 0.22,
      attackCooldown: 1,
      attackRate: 4,
      attackRadius: 140,
      starved: false,
    };

    updateFlocking(fish, [shark], {
      width: 420,
      height: 320,
      threatRadius: 150,
      dt: 1,
    });

    expect(fish[0].threatened).toBe(true);
    expect(fish[2].threatened).toBe(false);
    expect(Math.hypot(fish[0].vel.x, fish[0].vel.y)).toBeGreaterThan(Math.hypot(fish[2].vel.x, fish[2].vel.y));
  });

  it("lets evasive fish react harder to shark danger paths than tanks", () => {
    const makeFish = (typeId: Fish["typeId"], className: Fish["className"], y: number, maxSpeed: number): Fish => ({
      id: `${typeId}-lane`,
      kind: "basic",
      typeId,
      className,
      pos: { x: 160, y },
      vel: { x: 0, y: 0 },
      radius: 4,
      maxSpeed,
      health: 2,
      maxHealth: 2,
      threatened: false,
      caught: false,
    });
    const shark: Shark = {
      id: "role-shark",
      kind: "basic",
      pos: { x: 100, y: 100 },
      vel: { x: 2.2, y: 0 },
      radius: 24,
      health: 100,
      maxHealth: 100,
      hunger: 60,
      maxHunger: 60,
      hungerDrain: 1,
      speed: 2.2,
      acceleration: 0.22,
      attackCooldown: 0.2,
      attackRate: 4,
      attackRadius: 140,
      starved: false,
    };
    const parrotfish = [makeFish("parrotfish", "support", 103, 2.34)];
    const grouper = [makeFish("grouper", "tank", 103, 1.62)];

    updateFlocking(parrotfish, [shark], { width: 400, height: 300, threatRadius: 120, dt: 1 });
    updateFlocking(grouper, [shark], { width: 400, height: 300, threatRadius: 120, dt: 1 });

    expect(Math.abs(parrotfish[0].vel.y)).toBeGreaterThan(Math.abs(grouper[0].vel.y));
  });
});
