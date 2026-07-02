import { describe, expect, it } from "vitest";
import gameSource from "./Game.ts?raw";

describe("Game artifact panel", () => {
  it("keeps build tags out of visible artifact card copy", () => {
    expect(gameSource).not.toContain("artifactBuildTagLabels");
    expect(gameSource).not.toContain("artifact-tags");
  });
});
