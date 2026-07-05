import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";
import { distance } from "./vector";
import { createSchool } from "../entities/School";
import { createSharks } from "../entities/Shark";
import { advanceKelpFeeding, fadeConsumedKelp, isFeedableKelpGoal, kelpGoalPosition, safeInteriorRect, schoolStartAnchor, sharkStartPosition } from "./startPositions";

describe("start positions", () => {
  const bounds = { width: 796, height: 540 };

  it("samples school anchors inside the safe interior", () => {
    const safe = safeInteriorRect(bounds);

    for (let seed = 1; seed <= 16; seed += 1) {
      const anchor = schoolStartAnchor(bounds, seed);

      expect(anchor.x).toBeGreaterThanOrEqual(safe.left);
      expect(anchor.x).toBeLessThanOrEqual(safe.right);
      expect(anchor.y).toBeGreaterThanOrEqual(safe.top);
      expect(anchor.y).toBeLessThanOrEqual(safe.bottom);
    }
  });

  it("varies school and shark starts while preserving a safe opening distance", () => {
    const anchors = [1, 2, 3, 4].map((seed) => schoolStartAnchor(bounds, seed));
    const uniqueAnchors = new Set(anchors.map((anchor) => `${Math.round(anchor.x)}:${Math.round(anchor.y)}`));

    expect(uniqueAnchors.size).toBeGreaterThan(2);

    for (let level = 1; level <= 8; level += 1) {
      const schoolAnchor = schoolStartAnchor(bounds, level);
      const sharkStart = sharkStartPosition(bounds, level, 0, 1, schoolAnchor, 24);

      expect(distance(schoolAnchor, sharkStart.pos)).toBeGreaterThanOrEqual(230);
    }
  });

  it("creates varied run starts without opening on top of sharks", () => {
    for (let level = 1; level <= 8; level += 1) {
      const school = createSchool(54, 0, bounds, undefined, undefined, level);
      const sharks = createSharks(createLevelConfig(level), bounds);
      const schoolCenter = {
        x: school.reduce((sum, fish) => sum + fish.pos.x, 0) / school.length,
        y: school.reduce((sum, fish) => sum + fish.pos.y, 0) / school.length,
      };

      expect(distance(schoolCenter, sharks[0].pos)).toBeGreaterThan(190);
    }
  });

  it("places kelp goals inside the safe interior away from edges", () => {
    const safe = safeInteriorRect(bounds);
    const schoolCenter = { x: bounds.width / 2, y: bounds.height / 2 };

    for (let seed = 1; seed <= 12; seed += 1) {
      const goal = kelpGoalPosition(bounds, seed, schoolCenter, [{ x: safe.left, y: safe.top }]);

      expect(goal.pos.x).toBeGreaterThanOrEqual(safe.left);
      expect(goal.pos.x).toBeLessThanOrEqual(safe.right);
      expect(goal.pos.y).toBeGreaterThanOrEqual(safe.top);
      expect(goal.pos.y).toBeLessThanOrEqual(safe.bottom);
      expect(goal.radius).toBeGreaterThan(0);
      expect(goal.state).toBe("dormant");
      expect(goal.progress).toBe(0);
      expect(goal.alpha).toBe(1);
    }
  });

  it("advances kelp feeding without letting large schools consume it instantly", () => {
    const goal = kelpGoalPosition(bounds, 3, { x: bounds.width / 2, y: bounds.height / 2 });
    const fed = advanceKelpFeeding(goal, 54, 1);

    expect(fed.state).toBe("feeding");
    expect(fed.progress).toBeGreaterThan(0);
    expect(fed.progress).toBeLessThan(0.2);
  });

  it("transitions kelp to consumed and then respawning as it fades", () => {
    const goal = {
      ...kelpGoalPosition(bounds, 4, { x: bounds.width / 2, y: bounds.height / 2 }),
      state: "feeding" as const,
      progress: 0.98,
    };
    const consumed = advanceKelpFeeding(goal, 4, 1);
    const faded = fadeConsumedKelp(consumed, 2);

    expect(consumed.state).toBe("consumed");
    expect(isFeedableKelpGoal(consumed)).toBe(false);
    expect(faded.state).toBe("respawning");
    expect(faded.alpha).toBe(0);
  });
});
