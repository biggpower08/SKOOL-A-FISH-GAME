import { describe, expect, it } from "vitest";
import type { Fish, RunState } from "../game/types";
import hudSource from "./hud.ts?raw";
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

    expect(schoolCounterText([makeFish("a"), makeFish("b"), makeFish("c", true)], run)).toBe("2 / 54");
  });

  it("keeps fish health bars clear of longer sidebar names", () => {
    expect(hudSource).toContain("const FISH_ROW_HEIGHT = 28");
    expect(hudSource).toContain("drawBar(ctx, x + 41, rowY + 14");
  });

  it("keeps only shark starvation status in the sidebar", () => {
    expect(hudSource).toContain("sharkLabels");
    expect(hudSource).toContain("summary.totalHunger / summary.maxHunger");
    expect(hudSource).not.toContain("summary.totalHealth / summary.maxHealth");
    expect(hudSource).toContain('"Norman"');
    expect(hudSource).toContain('"Steezy"');
    expect(hudSource).toContain('"Bill"');
    expect(hudSource).toContain('"Grog"');
  });

  it("keeps active sidebar focused on current run essentials", () => {
    expect(hudSource).toContain("uiIconAssets.fishCounter");
    expect(hudSource).toContain("uiIconAssets.shell");
    expect(hudSource).not.toContain("shellMark");
    expect(hudSource).not.toContain("Best L");
    expect(hudSource).not.toContain("Build ${buildHintForRun(run)}");
    expect(hudSource).not.toContain("run.schoolEnergy / 110");
    expect(hudSource).not.toContain('"School"');
    expect(hudSource).not.toContain('"Sharks"');
    expect(hudSource).not.toContain("Shells ${run.currency}");
    expect(hudSource).not.toContain("BUILD_LABEL");
  });
});
