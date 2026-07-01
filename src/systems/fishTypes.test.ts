import { describe, expect, it } from "vitest";
import { fishTypeDefinitions, fishTypes, recruitmentChoices } from "./fishTypes";

describe("fish type definitions", () => {
  it("keeps each recruitable fish mechanically distinct and readable", () => {
    expect(recruitmentChoices.map((choice) => choice.id)).toEqual(["tilapia", "salmon", "parrotfish", "mahi-mahi", "grouper"]);

    for (const definition of fishTypeDefinitions) {
      expect(definition.recruitAmount).toBeGreaterThan(0);
      expect(definition.role).toMatch(/\S/);
      expect(definition.description).toMatch(/\S/);
      expect(definition.mechanics).toMatch(/\S/);
      expect(definition.buildTags.length).toBeGreaterThan(0);
    }

    expect(fishTypes.tilapia).toMatchObject({
      role: "Swarm filler",
      recruitAmount: 5,
      buildTags: expect.arrayContaining(["tilapia-swarm"]),
    });
    expect(fishTypes.salmon).toMatchObject({
      role: "Balanced survivor",
      recruitAmount: 3,
      buildTags: expect.arrayContaining(["salmon-generalist", "balanced-school"]),
    });
    expect(fishTypes.parrotfish).toMatchObject({
      role: "Fast evasive fish",
      recruitAmount: 2,
      buildTags: expect.arrayContaining(["parrotfish-evasion"]),
    });
    expect(fishTypes["mahi-mahi"]).toMatchObject({
      role: "Tempo sprinter",
      recruitAmount: 2,
      buildTags: expect.arrayContaining(["mahi-tempo"]),
    });
    expect(fishTypes.grouper).toMatchObject({
      role: "Tanky bodyguard",
      recruitAmount: 1,
      buildTags: expect.arrayContaining(["grouper-protector"]),
    });
  });

  it("backs the fish role copy with real stat differences", () => {
    expect(fishTypes.parrotfish.maxSpeed).toBeGreaterThan(fishTypes.salmon.maxSpeed);
    expect(fishTypes.parrotfish.evasion).toBeGreaterThan(fishTypes.salmon.evasion);
    expect(fishTypes["mahi-mahi"].maxSpeed).toBeGreaterThan(fishTypes.parrotfish.maxSpeed);
    expect(fishTypes["mahi-mahi"].maxHealth).toBeLessThanOrEqual(fishTypes.salmon.maxHealth);
    expect(fishTypes.grouper.maxHealth).toBeGreaterThan(fishTypes.salmon.maxHealth);
    expect(fishTypes.grouper.protection).toBeGreaterThan(fishTypes.salmon.protection);
    expect(fishTypes.grouper.maxSpeed).toBeLessThan(fishTypes.salmon.maxSpeed);
    expect(fishTypes.tilapia.recruitAmount).toBeGreaterThan(fishTypes.salmon.recruitAmount);
  });
});
