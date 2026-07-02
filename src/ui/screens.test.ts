import { describe, expect, it } from "vitest";
import screensSource from "./screens.ts?raw";

describe("choice screens", () => {
  it("shows exact Shell shortage on locked recruit buttons", () => {
    expect(screensSource).toContain("Need ${option.shellCost - handlers.run.currency} Shells");
  });
});
