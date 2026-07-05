import { describe, expect, it } from "vitest";
import {
  fishSpriteManifest,
  getFishSprite,
  getSharkSprite,
  rippleOriginForMotion,
  sharkSpriteManifest,
  spriteDrawSize,
  spriteRippleSize,
} from "./sprites";
import combatSource from "../systems/combat.ts?raw";
import spritesSource from "./sprites.ts?raw";

describe("sprite manifest", () => {
  it("maps every provided cleaned fish sprite and leaves missing fish as fallback", () => {
    expect(getFishSprite("tilapia")?.src).toContain("tilapia.png");
    expect(getFishSprite("salmon")?.src).toContain("salmon.png");
    expect(getFishSprite("mahi-mahi")?.src).toContain("mahi-mahi.png");
    expect(getFishSprite("grouper")?.src).toContain("grouper.png");
    expect(getFishSprite("parrotfish")?.src).toContain("parrotfish.png");
    expect(Object.keys(fishSpriteManifest).sort()).toEqual(["grouper", "mahi-mahi", "parrotfish", "salmon", "tilapia"]);
  });

  it("maps the provided shark sprite", () => {
    expect(getSharkSprite("basic")?.src).toContain("shark.png");
  });

  it("maps named shark variants to the cleaned transparent assets", () => {
    expect(getSharkSprite("fast")?.src).toContain("steezy_nose_piercing_shark_clean.png");
    expect(getSharkSprite("center")?.src).toContain("bill_bandana_shark_clean.png");
    expect(getSharkSprite("barracuda")?.src).toContain("grog_steampunk_hat_shark_clean.png");
    expect(Object.values(sharkSpriteManifest).every((entry) => !entry.src.includes("_white_edges"))).toBe(true);
  });

  it("keeps Grog large enough for the steampunk hat to read", () => {
    const grog = getSharkSprite("barracuda");
    const basic = getSharkSprite("basic");

    expect(grog?.spriteKey).toBe("grog-shark");
    expect(grog?.visualScale).toBeGreaterThan(basic?.visualScale ?? 0);
    expect(spritesSource).toContain("visualScale: 3.35 * PROTOTYPE_SHARK_VISUAL_BOOST");
  });

  it("scales sprite draw boxes without changing gameplay radius", () => {
    const tilapia = getFishSprite("tilapia");

    expect(tilapia).toBeDefined();

    const size = spriteDrawSize(tilapia!, 4);

    expect(size.width).toBeGreaterThan(4 * 2);
    expect(size.height / size.width).toBeCloseTo(tilapia!.height / tilapia!.width);
  });

  it("uses larger prototype sprite scales so the fish and shark art is readable", () => {
    const tilapia = getFishSprite("tilapia");
    const shark = getSharkSprite("basic");

    expect(tilapia?.visualScale).toBeGreaterThanOrEqual(6.5);
    expect(shark?.visualScale).toBeGreaterThanOrEqual(3.9);
    expect(spritesSource).toContain("const PROTOTYPE_FISH_VISUAL_BOOST = 1.28");
    expect(spritesSource).toContain("const PROTOTYPE_SHARK_VISUAL_BOOST = 1.27");
  });

  it("keeps gameplay catch sizing separate from sprite readability boosts", () => {
    expect(spritesSource).not.toContain("CATCH_FISH_BODY_SCALE");
    expect(spritesSource).not.toContain("CATCH_SHARK_BODY_SCALE");
    expect(combatSource).toContain("const CATCH_FISH_BODY_SCALE = 2.4");
    expect(combatSource).toContain("const CATCH_SHARK_BODY_SCALE = 0.25");
  });

  it("uses sprite footprint and motion for ripple placement", () => {
    const salmon = getFishSprite("salmon");

    expect(salmon).toBeDefined();

    const size = spriteRippleSize(salmon!, 4.5);
    const origin = rippleOriginForMotion({ x: 100, y: 80 }, { x: 2, y: 0 }, size);

    expect(size).toBeGreaterThan(4.5);
    expect(origin.x).toBeLessThan(100);
    expect(origin.y).toBe(80);
  });
});
