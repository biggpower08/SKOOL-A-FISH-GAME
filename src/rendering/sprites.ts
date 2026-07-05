import type { FishTypeId, SharkKind, SpriteManifestEntry, Vector } from "../game/types";
import { cleanedSharkAssets } from "./assetPaths";

const SPRITE_BASE = `${import.meta.env.BASE_URL}assets/skool-a-fish/sprites`;
const PROTOTYPE_FISH_VISUAL_BOOST = 1.34;
const PROTOTYPE_SHARK_VISUAL_BOOST = 1.32;

export const fishSpriteManifest: Partial<Record<FishTypeId, SpriteManifestEntry>> = {
  tilapia: {
    spriteKey: "tilapia",
    src: `${SPRITE_BASE}/tilapia.png`,
    frameCount: 1,
    width: 1165,
    height: 885,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#ffffff",
    visualScale: 5.1 * PROTOTYPE_FISH_VISUAL_BOOST,
    rippleScale: 0.68,
  },
  salmon: {
    spriteKey: "salmon",
    src: `${SPRITE_BASE}/salmon.png`,
    frameCount: 1,
    width: 1210,
    height: 834,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#f4d2c7",
    visualScale: 5.4 * PROTOTYPE_FISH_VISUAL_BOOST,
    rippleScale: 0.7,
  },
  "mahi-mahi": {
    spriteKey: "mahi-mahi",
    src: `${SPRITE_BASE}/mahi-mahi.png`,
    frameCount: 1,
    width: 1254,
    height: 840,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#9fd8ff",
    visualScale: 5.4 * PROTOTYPE_FISH_VISUAL_BOOST,
    rippleScale: 0.72,
  },
  grouper: {
    spriteKey: "grouper",
    src: `${SPRITE_BASE}/grouper.png`,
    frameCount: 1,
    width: 1250,
    height: 1087,
    anchorX: 0.5,
    anchorY: 0.54,
    fallbackColor: "#d6c99a",
    visualScale: 5.0 * PROTOTYPE_FISH_VISUAL_BOOST,
    rippleScale: 0.76,
  },
  parrotfish: {
    spriteKey: "parrotfish",
    src: `${SPRITE_BASE}/parrotfish.png`,
    frameCount: 1,
    width: 962,
    height: 588,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#8ff4d2",
    visualScale: 5.8 * PROTOTYPE_FISH_VISUAL_BOOST,
    rippleScale: 0.72,
  },
};

export const sharkSpriteManifest: Partial<Record<SharkKind, SpriteManifestEntry>> = {
  basic: {
    spriteKey: "shark",
    src: `${SPRITE_BASE}/shark.png`,
    frameCount: 1,
    width: 1220,
    height: 717,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#151a20",
    visualScale: 3.1 * PROTOTYPE_SHARK_VISUAL_BOOST,
    rippleScale: 0.78,
  },
  fast: {
    spriteKey: "steezy-shark",
    src: cleanedSharkAssets.steezy,
    frameCount: 1,
    width: 1232,
    height: 718,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#151a20",
    visualScale: 3.1 * PROTOTYPE_SHARK_VISUAL_BOOST,
    rippleScale: 0.78,
  },
  center: {
    spriteKey: "bill-shark",
    src: cleanedSharkAssets.bill,
    frameCount: 1,
    width: 1229,
    height: 848,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#151a20",
    visualScale: 3.05 * PROTOTYPE_SHARK_VISUAL_BOOST,
    rippleScale: 0.78,
  },
  barracuda: {
    spriteKey: "grog-shark",
    src: cleanedSharkAssets.grog,
    frameCount: 1,
    width: 1228,
    height: 777,
    anchorX: 0.5,
    anchorY: 0.52,
    fallbackColor: "#151a20",
    visualScale: 2.85 * PROTOTYPE_SHARK_VISUAL_BOOST,
    rippleScale: 0.76,
  },
};

export const getFishSprite = (typeId: FishTypeId): SpriteManifestEntry | undefined => fishSpriteManifest[typeId];

export const getSharkSprite = (kind: SharkKind): SpriteManifestEntry | undefined => sharkSpriteManifest[kind] ?? sharkSpriteManifest.basic;

export const spriteDrawSize = (sprite: SpriteManifestEntry, radius: number): { width: number; height: number } => {
  const width = radius * sprite.visualScale;

  return {
    width,
    height: width * (sprite.height / sprite.width),
  };
};

export const spriteRippleSize = (sprite: SpriteManifestEntry, radius: number): number => spriteDrawSize(sprite, radius).width * sprite.rippleScale;

export const rippleOriginForMotion = (pos: Vector, vel: Vector, size: number): Vector => {
  const speed = Math.hypot(vel.x, vel.y);

  if (speed < 0.01) {
    return pos;
  }

  return {
    x: pos.x - (vel.x / speed) * size * 0.12,
    y: pos.y - (vel.y / speed) * size * 0.12,
  };
};
