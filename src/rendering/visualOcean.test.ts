import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Fish } from "../game/types";
import { drawBackground } from "./renderer";
import { fishWakeFor, swimPoseForFish } from "./fishMotion";

const source = (path: string): string => readFileSync(join(process.cwd(), path), "utf8");

const makeFish = (overrides: Partial<Fish> = {}): Fish => ({
  id: "fish-1",
  kind: "basic",
  typeId: "tilapia",
  className: "common",
  pos: { x: 100, y: 80 },
  vel: { x: 1.8, y: 0.3 },
  radius: 4,
  maxSpeed: 2,
  health: 1,
  maxHealth: 1,
  threatened: false,
  caught: false,
  ...overrides,
});

describe("visual ocean readability", () => {
  it("keeps combat rendering off the old detached ripple path", () => {
    expect(source("src/rendering/renderer.ts")).not.toContain("drawWaterRipples");
    expect(source("src/game/Game.ts")).not.toContain("spawnRipple");
  });

  it("uses a darker reef-ocean background palette", () => {
    const stops: Array<{ offset: number; color: string }> = [];
    const context = {
      createLinearGradient: () => ({
        addColorStop: (offset: number, color: string) => stops.push({ offset, color }),
      }),
      fillStyle: "",
      fillRect: () => undefined,
    };

    drawBackground(context as unknown as CanvasRenderingContext2D, 800, 480);

    expect(stops.map((stop) => stop.color)).toEqual(["#01070d", "#052123", "#101830", "#020309"]);
  });

  it("keeps fish wakes movement-tied, subtle, and speed-sensitive", () => {
    const slow = fishWakeFor(makeFish({ vel: { x: 0.2, y: 0.05 } }));
    const tilapia = fishWakeFor(makeFish({ typeId: "tilapia", vel: { x: 1.4, y: 0.1 }, maxSpeed: 2 }));
    const mahi = fishWakeFor(makeFish({ typeId: "mahi-mahi", vel: { x: 2.5, y: 0.1 }, maxSpeed: 2.6 }));

    expect(slow).toBeNull();
    expect(tilapia?.strength).toBeGreaterThan(0);
    expect(tilapia?.strength).toBeLessThan(0.18);
    expect(mahi?.radius).toBeGreaterThan(tilapia?.radius ?? 0);
    expect(mahi?.strength).toBeGreaterThan(tilapia?.strength ?? 0);
  });

  it("adds a subtle visual swim pose without changing gameplay position", () => {
    const fish = makeFish({ id: "fish-tilt", vel: { x: 1.9, y: 0.2 } });
    const first = swimPoseForFish(fish, 1000);
    const later = swimPoseForFish(fish, 1400);

    expect(Math.abs(first.offsetY)).toBeLessThanOrEqual(1.8);
    expect(Math.abs(first.rotation)).toBeLessThanOrEqual(0.08);
    expect(later).not.toEqual(first);
  });
});
