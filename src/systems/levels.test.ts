import { describe, expect, it } from "vitest";
import { createLevelConfig } from "./levels";

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
    expect(["fight", "shop", "investment", "special", "reward"]).toContain(levelSeventyFive.type);
  });

  it("keeps most sampled levels as plain fights", () => {
    const levels = Array.from({ length: 70 }, (_, index) => createLevelConfig(index + 1));
    const fightCount = levels.filter((level) => level.type === "fight").length;

    expect(fightCount / levels.length).toBeGreaterThan(0.68);
  });
});
