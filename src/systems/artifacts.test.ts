import { describe, expect, it } from "vitest";
import { artifactBuildArchetypes, artifactBuildTagLabels, artifactDefinitions, isArtifactId } from "./artifacts";

describe("artifact definitions", () => {
  it("has about 50 compact named artifacts for the placeholder collection page", () => {
    expect(artifactDefinitions).toHaveLength(50);
    expect(new Set(artifactDefinitions.map((artifact) => artifact.id)).size).toBe(artifactDefinitions.length);
  });

  it("keeps simple artifact display data ready for icons and categories", () => {
    const sample = artifactDefinitions.find((artifact) => artifact.id === "peaceful-panic-whistle");

    expect(sample).toMatchObject({
      name: "Peaceful Panic Whistle",
      rarity: "rare",
      category: "fish evasion",
      iconKey: "whistle",
    });
    expect(sample?.effect.length).toBeLessThanOrEqual(38);
  });

  it("recognizes all configured artifacts as reward choices", () => {
    expect(isArtifactId("bubble-net")).toBe(true);
    expect(isArtifactId("peaceful-panic-whistle")).toBe(true);
    expect(isArtifactId("not-an-artifact")).toBe(false);
  });

  it("marks only selected artifacts as upgrade-ready with Shell costs", () => {
    const upgradeable = artifactDefinitions.filter((artifact) => artifact.maxLevel && artifact.maxLevel > 1);
    const kelpBandage = artifactDefinitions.find((artifact) => artifact.id === "kelp-bandage");
    const sharkToothCharm = artifactDefinitions.find((artifact) => artifact.id === "shark-tooth-charm");

    expect(upgradeable.length).toBeGreaterThanOrEqual(5);
    expect(upgradeable.length).toBeLessThan(artifactDefinitions.length);
    expect(kelpBandage).toMatchObject({
      level: 1,
      maxLevel: 3,
      upgradeShellCost: expect.any(Number),
      upgradeText: expect.any(String),
    });
    expect(kelpBandage?.upgradeShellCost).toBeGreaterThan(0);
    expect(sharkToothCharm?.maxLevel).toBeUndefined();
  });

  it("connects artifacts to visible fish-role build archetypes", () => {
    expect(artifactBuildArchetypes).toEqual([
      "balanced-school",
      "tilapia-swarm",
      "parrotfish-evasion",
      "grouper-protector",
      "mahi-tempo",
      "salmon-generalist",
      "shell-economy",
      "kelp-recovery",
      "anti-shark-survival",
      "risky-joke",
    ]);

    for (const archetype of artifactBuildArchetypes) {
      expect(artifactBuildTagLabels[archetype]).toMatch(/\S/);
      expect(artifactDefinitions.some((artifact) => artifact.buildTags.includes(archetype))).toBe(true);
    }

    expect(artifactDefinitions.every((artifact) => artifact.buildTags.length > 0)).toBe(true);
    expect(artifactDefinitions.find((artifact) => artifact.id === "tilapia-town-charter")?.buildTags).toContain("tilapia-swarm");
    expect(artifactDefinitions.find((artifact) => artifact.id === "grouper-hard-hat")?.buildTags).toContain("grouper-protector");
    expect(artifactDefinitions.find((artifact) => artifact.id === "parrotfish-mood-ring")?.buildTags).toContain("parrotfish-evasion");
  });
});
