import { describe, expect, it } from "vitest";
import screensSource from "./screens.ts?raw";

describe("choice screens", () => {
  it("shows exact Shell shortage on locked recruit buttons", () => {
    expect(screensSource).toContain("Need ${option.shellCost - handlers.run.currency} Shells");
  });

  it("shows artifact-adjusted kelp recovery limits in break choices", () => {
    expect(screensSource).toContain("const kelpRestoreLimit = 5 + getSchoolModifiers(handlers.run).kelpRestoreBonus");
    expect(screensSource).toContain("Recover up to ${Math.min(kelpRestoreLimit, recoverableFish)} fish");
  });
});
