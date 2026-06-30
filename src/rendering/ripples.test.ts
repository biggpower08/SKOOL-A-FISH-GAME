import { describe, expect, it } from "vitest";
import { spawnRipple, updateRipples } from "./ripples";

describe("ripples", () => {
  it("expands, drifts, and fades water ripples subtly", () => {
    const ripples = [spawnRipple({ x: 120, y: 80 }, 24, 0.18)];
    const startRadius = ripples[0].radius;

    const updated = updateRipples(ripples, 0.25);

    expect(updated).toHaveLength(1);
    expect(Math.abs(updated[0].x - 120)).toBeLessThan(1);
    expect(Math.abs(updated[0].y - 80)).toBeLessThan(1);
    expect(updated[0].radius).toBeGreaterThan(startRadius);
    expect(updated[0].opacity).toBeLessThan(0.18);
  });

  it("removes ripples after their lifetime", () => {
    const ripples = [spawnRipple({ x: 20, y: 30 }, 18, 0.14)];

    expect(updateRipples(ripples, 2)).toHaveLength(0);
  });
});
