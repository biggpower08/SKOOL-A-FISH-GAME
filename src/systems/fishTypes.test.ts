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
      recruitAmount: 8,
      buildTags: expect.arrayContaining(["tilapia-swarm"]),
    });
    expect(fishTypes.salmon).toMatchObject({
      role: "Balanced survivor",
      recruitAmount: 5,
      buildTags: expect.arrayContaining(["salmon-generalist", "balanced-school"]),
    });
    expect(fishTypes.parrotfish).toMatchObject({
      role: "Evasive control fish",
      recruitAmount: 4,
      buildTags: expect.arrayContaining(["parrotfish-evasion"]),
    });
    expect(fishTypes["mahi-mahi"]).toMatchObject({
      role: "Tempo sprinter",
      recruitAmount: 4,
      buildTags: expect.arrayContaining(["mahi-tempo"]),
    });
    expect(fishTypes.grouper).toMatchObject({
      role: "Tanky bodyguard",
      recruitAmount: 2,
      buildTags: expect.arrayContaining(["grouper-protector"]),
    });
  });

  it("backs the fish role copy with real stat differences", () => {
    expect(fishTypes.tilapia.maxSpeed).toBeGreaterThanOrEqual(2.1);
    expect(fishTypes.salmon.maxSpeed).toBeGreaterThanOrEqual(2.2);
    expect(fishTypes.grouper.maxSpeed).toBeGreaterThanOrEqual(1.6);
    expect(fishTypes.parrotfish.maxSpeed).toBeGreaterThan(fishTypes.salmon.maxSpeed);
    expect(fishTypes.parrotfish.evasion).toBeGreaterThan(fishTypes.salmon.evasion);
    expect(fishTypes.parrotfish.evasion - fishTypes["mahi-mahi"].evasion).toBeGreaterThanOrEqual(0.14);
    expect(fishTypes["mahi-mahi"].maxSpeed - fishTypes.parrotfish.maxSpeed).toBeGreaterThanOrEqual(0.35);
    expect(fishTypes["mahi-mahi"].maxHealth).toBeLessThanOrEqual(fishTypes.salmon.maxHealth);
    expect(fishTypes.grouper.maxHealth).toBeGreaterThan(fishTypes.salmon.maxHealth);
    expect(fishTypes.grouper.protection).toBeGreaterThan(fishTypes.salmon.protection);
    expect(fishTypes.grouper.maxSpeed).toBeLessThan(fishTypes.salmon.maxSpeed);
    expect(fishTypes.tilapia.recruitAmount).toBeGreaterThan(fishTypes.salmon.recruitAmount);
  });

  it("describes generous recruit bundles and Shell-gated premium choices", () => {
    const choicesById = Object.fromEntries(recruitmentChoices.map((choice) => [choice.id, choice]));

    expect(choicesById.tilapia).toMatchObject({
      amount: 8,
      shellCost: 0,
      fishCounts: { tilapia: 8 },
    });
    expect(choicesById.salmon).toMatchObject({
      amount: 5,
      shellCost: 0,
      fishCounts: { salmon: 5 },
    });
    expect(choicesById.parrotfish).toMatchObject({
      amount: 4,
      shellCost: 8,
      fishCounts: { parrotfish: 4 },
    });
    expect(choicesById["mahi-mahi"]).toMatchObject({
      amount: 4,
      shellCost: 8,
      fishCounts: { "mahi-mahi": 4 },
    });
    expect(choicesById.grouper).toMatchObject({
      amount: 5,
      shellCost: 12,
      fishCounts: { grouper: 2, salmon: 3 },
    });
  });
});
