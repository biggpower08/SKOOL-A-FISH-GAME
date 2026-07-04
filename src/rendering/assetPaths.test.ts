import { describe, expect, it } from "vitest";
import { cleanedSharkAssets, uiIconAssets } from "./assetPaths";

describe("clean asset paths", () => {
  it("exposes cleaned transparent UI icon paths", () => {
    expect(uiIconAssets.shell).toContain("assets/ui/shell_icon_transparent.png");
    expect(uiIconAssets.fishCounter).toContain("assets/ui/fish_counter_icon_transparent.png");
    expect(uiIconAssets.kelp).toContain("assets/ui/kelp_icon_transparent.png");
    expect(uiIconAssets.treasureChest).toContain("assets/ui/treasure_chest_icon_transparent.png");
  });

  it("exposes cleaned named shark variant paths", () => {
    expect(cleanedSharkAssets.grog).toContain("assets/sharks/grog_steampunk_hat_shark_clean.png");
    expect(cleanedSharkAssets.bill).toContain("assets/sharks/bill_bandana_shark_clean.png");
    expect(cleanedSharkAssets.steezy).toContain("assets/sharks/steezy_nose_piercing_shark_clean.png");
    expect(Object.values(cleanedSharkAssets).every((path) => path.includes("_clean.png"))).toBe(true);
  });
});
