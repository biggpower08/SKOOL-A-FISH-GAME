import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";
import { distance } from "./vector";
import { createSchool } from "../entities/School";
import { createSharks } from "../entities/Shark";
import { safeInteriorRect, schoolStartAnchor, sharkStartPosition } from "./startPositions";

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
});
