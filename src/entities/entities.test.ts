import { describe, expect, it } from "vitest";
import { createSchool } from "./School";
import { createSharks, updateSharks } from "./Shark";
import { createLevelConfig } from "../systems/levels";

describe("entities", () => {
  it("creates basic and support fish as placeholder circles", () => {
    const school = createSchool(8, 2, { width: 600, height: 400 });

    expect(school.filter((fish) => fish.kind === "basic")).toHaveLength(8);
    expect(school.filter((fish) => fish.kind === "support")).toHaveLength(2);
    expect(school.every((fish) => fish.radius > 0 && !fish.caught)).toBe(true);
  });

  it("creates named fish types with distinct placeholder stats", () => {
    const school = createSchool(
      0,
      1,
      { width: 600, height: 400 },
      {
        salmon: 2,
        tilapia: 3,
        grouper: 1,
        parrotfish: 1,
        "mahi-mahi": 1,
      },
    );

    expect(school.filter((fish) => fish.typeId === "salmon")).toHaveLength(2);
    expect(school.filter((fish) => fish.typeId === "support")).toHaveLength(1);
    expect(school.find((fish) => fish.typeId === "grouper")?.maxHealth).toBeGreaterThan(
      school.find((fish) => fish.typeId === "tilapia")?.maxHealth ?? 0,
    );
    expect(school.find((fish) => fish.typeId === "mahi-mahi")?.maxSpeed).toBeGreaterThan(
      school.find((fish) => fish.typeId === "salmon")?.maxSpeed ?? 0,
    );
  });

  it("creates sharks from level config and moves them toward the school", () => {
    const config = createLevelConfig(12);
    const sharks = createSharks(config, { width: 600, height: 400 });
    const school = createSchool(4, 0, { width: 600, height: 400 });
    const startX = sharks[0].pos.x;

    updateSharks(sharks, school, { width: 600, height: 400 }, 1);

    expect(sharks).toHaveLength(config.sharkCount);
    expect(sharks[0].maxHealth).toBeGreaterThan(0);
    expect(sharks[0].pos.x).toBeLessThan(startX);
  });
});
