import { describe, expect, it } from "vitest";
import { createLevelConfig, createLevelPathPreview } from "./levels";

describe("createLevelConfig", () => {
  it("keeps level 70 achievable before hard mode scaling starts", () => {
    const levelOne = createLevelConfig(1);
    const levelSeventy = createLevelConfig(70);

    expect(levelOne.type).toBe("fight");
    expect(levelSeventy.level).toBe(70);
    expect(levelSeventy.sharkHealth).toBeGreaterThan(levelOne.sharkHealth);
    expect(levelSeventy.sharkSpeed).toBeGreaterThan(levelOne.sharkSpeed);
    expect(levelSeventy.sharkAttackRate).toBeLessThan(levelOne.sharkAttackRate);
  });

  it("makes level 70 plus meaningfully harder without inventing new mechanics", () => {
    const levelSeventy = createLevelConfig(70);
    const levelSeventyFive = createLevelConfig(75);

    expect(levelSeventyFive.sharkHealth).toBeGreaterThan(levelSeventy.sharkHealth);
    expect(levelSeventyFive.sharkSpeed).toBeGreaterThanOrEqual(levelSeventy.sharkSpeed);
    expect(["fight", "shop", "investment", "special", "reward", "recruit"]).toContain(levelSeventyFive.type);
  });

  it("keeps most sampled levels as plain fights", () => {
    const levels = Array.from({ length: 70 }, (_, index) => createLevelConfig(index + 1));
    const fightCount = levels.filter((level) => level.type === "fight").length;

    expect(fightCount / levels.length).toBeGreaterThan(0.68);
  });

  it("previews the current and upcoming level path with icons", () => {
    const preview = createLevelPathPreview(6, 5);

    expect(preview).toHaveLength(5);
    expect(preview[0].level).toBe(6);
    expect(preview[0].current).toBe(true);
    expect(preview.map((step) => step.icon)).toContain("+");
    expect(preview.every((step) => step.label.length > 0)).toBe(true);
  });

  it("uses planned recruitment nodes instead of direct fish purchases", () => {
    expect(createLevelConfig(7).type).toBe("recruit");
    expect(createLevelConfig(21).type).toBe("recruit");
    expect(createLevelConfig(35).type).toBe("recruit");
  });

  it("pays meaningful shells and scales rewards upward", () => {
    const levelOne = createLevelConfig(1);
    const levelTen = createLevelConfig(10);

    expect(levelOne.rewardCurrency).toBeGreaterThanOrEqual(100);
    expect(levelOne.rewardCurrency).toBeLessThanOrEqual(200);
    expect(levelTen.rewardCurrency).toBeGreaterThan(levelOne.rewardCurrency);
  });

  it("keeps healing and investment to interval nodes", () => {
    const levels = Array.from({ length: 30 }, (_, index) => createLevelConfig(index + 1));
    const choiceLevels = levels.filter((level) => ["shop", "investment", "special", "reward", "recruit"].includes(level.type));

    expect(choiceLevels.length).toBeLessThan(12);
    expect(levels.filter((level) => level.type === "investment")).toHaveLength(2);
  });
});
