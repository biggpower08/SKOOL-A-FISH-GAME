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
});
