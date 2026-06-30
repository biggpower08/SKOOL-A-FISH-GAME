import { describe, expect, it } from "vitest";
import { artifactDefinitions, isArtifactId } from "./artifacts";

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
});
