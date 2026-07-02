import { describe, expect, it } from "vitest";
import { createSchool } from "./School";
import { createSharks, updateSharks } from "./Shark";
import { createLevelConfig } from "../systems/levels";
import { getSchoolModifiers } from "../systems/artifactEffects";
import { createNewRun } from "../systems/upgrades";
import { fishTypes } from "../systems/fishTypes";
import { distance } from "../systems/vector";

describe("entities", () => {
  it("creates active fish as placeholder circles without support fish", () => {
    const school = createSchool(8, 2, { width: 600, height: 400 });

    expect(school.filter((fish) => fish.kind === "basic")).toHaveLength(8);
    expect(school.filter((fish) => fish.kind === "support")).toHaveLength(0);
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
    expect(school.filter((fish) => fish.typeId === "support")).toHaveLength(0);
    expect(school.find((fish) => fish.typeId === "grouper")?.maxHealth).toBeGreaterThan(
      school.find((fish) => fish.typeId === "tilapia")?.maxHealth ?? 0,
    );
    expect(school.find((fish) => fish.typeId === "mahi-mahi")?.maxSpeed).toBeGreaterThan(
      school.find((fish) => fish.typeId === "salmon")?.maxSpeed ?? 0,
    );
  });

  it("applies artifact modifiers to recruited fish spawn stats", () => {
    const modifiers = getSchoolModifiers({
      ...createNewRun(),
      ownedArtifacts: ["parrotfish-mood-ring", "grouper-hard-hat"],
      fishCounts: {
        parrotfish: 1,
        grouper: 1,
      },
    });
    const school = createSchool(
      0,
      0,
      { width: 600, height: 400 },
      {
        parrotfish: 1,
        grouper: 1,
      },
      modifiers,
    );

    expect(school.find((fish) => fish.typeId === "parrotfish")?.maxSpeed).toBeGreaterThan(fishTypes.parrotfish.maxSpeed);
    expect(school.find((fish) => fish.typeId === "grouper")?.maxHealth).toBeGreaterThan(fishTypes.grouper.maxHealth);
  });

  it("spawns a large opening school with readable spacing", () => {
    const school = createSchool(54, 0, { width: 796, height: 540 });
    const nearestGaps = school.map((fish) =>
      Math.min(...school.filter((candidate) => candidate !== fish).map((candidate) => distance(fish.pos, candidate.pos))),
    );

    expect(Math.min(...nearestGaps)).toBeGreaterThan(11);
    expect(nearestGaps.filter((gap) => gap < 15)).toHaveLength(0);
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
