/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import type { Fish } from "../game/types";
import gameSource from "../game/Game.ts?raw";
import rendererSource from "./renderer.ts?raw";
import waterDisturbanceSource from "./waterDisturbance.ts?raw";
import { drawBackground } from "./renderer";
import { fishWakeFor, swimPoseForFish } from "./fishMotion";

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
    expect(rendererSource).not.toContain("drawWaterRipples");
    expect(gameSource).not.toContain("spawnRipple");
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

    expect(stops.map((stop) => stop.color)).toEqual(["#00040a", "#03181b", "#0a1025", "#010207"]);
  });

  it("keeps fish wakes movement-tied, subtle, and speed-sensitive", () => {
    const slow = fishWakeFor(makeFish({ vel: { x: 0.2, y: 0.05 } }));
    const tilapia = fishWakeFor(makeFish({ typeId: "tilapia", vel: { x: 1.4, y: 0.1 }, maxSpeed: 2 }));
    const mahi = fishWakeFor(makeFish({ typeId: "mahi-mahi", vel: { x: 2.5, y: 0.1 }, maxSpeed: 2.6 }));

    expect(slow).toBeNull();
    expect(tilapia?.strength).toBeGreaterThan(0);
    expect(tilapia?.strength).toBeLessThanOrEqual(0.18);
    expect(mahi?.radius).toBeGreaterThan(tilapia?.radius ?? 0);
    expect(mahi?.strength).toBeGreaterThan(tilapia?.strength ?? 0);
  });

  it("keeps shark health out of the playfield renderer", () => {
    expect(rendererSource).not.toContain("drawSharkHealthBar");
    expect(rendererSource).not.toContain("drawUnitHealthBar");
    expect(rendererSource).not.toContain("shark.health / shark.maxHealth");
  });

  it("renders caught fish as gray fade instead of threat red", () => {
    expect(rendererSource).toContain('candidate.caught ? "#7f8890"');
    expect(rendererSource).toContain('candidate.caught ? "rgba(128, 136, 142, 0.62)"');
    expect(rendererSource.indexOf("candidate.caught ?")).toBeLessThan(rendererSource.indexOf("candidate.threatened ?"));
  });

  it("uses filled wave fields instead of clunky wake line strokes", () => {
    expect(rendererSource).toContain("const drawWaveGlowFields");
    expect(rendererSource).not.toContain("const drawWaterCurrents");
    expect(waterDisturbanceSource).not.toContain("ctx.stroke()");
    expect(waterDisturbanceSource).not.toContain("quadraticCurveTo");
  });

  it("draws kelp goals with the integrated kelp asset behind fish", () => {
    expect(rendererSource).toContain("uiIconAssets.kelp");
    expect(rendererSource).toContain("const drawKelpGoal");
    expect(rendererSource.indexOf("drawKelpGoal(ctx, kelpGoal, time)")).toBeLessThan(
      rendererSource.indexOf("for (const candidate of fish)"),
    );
  });

  it("uses tint and accessories instead of dead shark X-eyes", () => {
    expect(rendererSource).toContain("const sharkTintFor");
    expect(rendererSource).toContain("const drawSharkAccessory");
    expect(rendererSource).toContain('"Norman"');
    expect(rendererSource).toContain('"Grog"');
    expect(rendererSource).toContain('"Steezy"');
    expect(rendererSource).toContain('"Bill"');
    expect(rendererSource).not.toContain("eyeY");
    expect(rendererSource).not.toContain("lineTo(eye.x + 3");
  });

  it("adds a subtle visual swim pose without changing gameplay position", () => {
    const fish = makeFish({ id: "fish-tilt", vel: { x: 1.9, y: 0.2 } });
    const first = swimPoseForFish(fish, 1000);
    const later = swimPoseForFish(fish, 1400);

    expect(Math.abs(first.offsetY)).toBeLessThanOrEqual(1.8);
    expect(Math.abs(first.rotation)).toBeLessThanOrEqual(0.08);
    expect(later).not.toEqual(first);
  });

  it("uses a larger animated fish school on the idle screen", () => {
    expect(rendererSource).toContain("const previewFish = [");
    expect(rendererSource.match(/\"tilapia\"|\"salmon\"|\"parrotfish\"|\"mahi-mahi\"|\"grouper\"/g)?.length).toBeGreaterThanOrEqual(12);
    expect(rendererSource).toContain("const loop = (time *");
  });
});
