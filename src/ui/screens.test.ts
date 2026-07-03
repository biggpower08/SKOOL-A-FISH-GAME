import { describe, expect, it } from "vitest";
import screensSource from "./screens.ts?raw";

describe("choice screens", () => {
  it("shows exact Shell shortage on locked recruit buttons", () => {
    expect(screensSource).toContain("Need ${option.shellCost - handlers.run.currency} Shells");
  });

  it("uses level-varying recruitment choices and dev buy copy", () => {
    expect(screensSource).toContain("recruitmentChoicesForLevel(handlers.run.level)");
    expect(screensSource).toContain('"Dev Buy"');
  });

  it("does not render an empty artifact-choice screen when artifacts are exhausted", () => {
    expect(screensSource).toContain("if (choices.length === 0)");
    expect(screensSource).toContain("All Artifacts Collected");
    expect(screensSource).toContain("Bonus Shells awarded.");
  });
});
