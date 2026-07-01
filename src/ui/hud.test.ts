import { describe, expect, it } from "vitest";
import type { Fish, RunState } from "../game/types";
import { schoolCounterText } from "./hud";
import { createNewRun } from "../systems/upgrades";

const makeFish = (id: string, caught = false): Fish => ({
  id,
  kind: "basic",
  typeId: "tilapia",
  className: "common",
  pos: { x: 0, y: 0 },
  vel: { x: 0, y: 0 },
  radius: 4,
  maxSpeed: 2,
  health: caught ? 0 : 1,
  maxHealth: 1,
  threatened: false,
  caught,
});

describe("HUD school counter", () => {
  it("shows live fish against the current school total", () => {
    const run: RunState = {
      ...createNewRun(),
      fishCount: 2,
      maxFishCount: 54,
      fishCounts: { tilapia: 2 },
    };

    expect(schoolCounterText([makeFish("a"), makeFish("b"), makeFish("c", true)], run)).toBe("Fish 2 / 54");
  });
});
