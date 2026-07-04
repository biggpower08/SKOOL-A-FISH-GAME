import type { Fish, LevelConfig, RunState, Shark, SpriteManifestEntry, Vector } from "../game/types";
import { isVisibleShark } from "../entities/Shark";
import { getFishSprite, getSharkSprite, spriteDrawSize } from "./sprites";
import type { WaterDisturbanceField } from "./waterDisturbance";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";
import { drawHud, hudWidth } from "../ui/hud";
import { swimPoseForFish } from "./fishMotion";
import { uiIconAssets } from "./assetPaths";
import type { KelpGoal } from "../systems/startPositions";

const CAUGHT_FADE_SECONDS = 0.56;

type SpriteCacheEntry = {
  image: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
};

const spriteCache = new Map<string, SpriteCacheEntry>();
const tintCanvasCache = new Map<string, HTMLCanvasElement>();
const kelpSprite: SpriteManifestEntry = {
  spriteKey: "kelp-goal",
  src: uiIconAssets.kelp,
  frameCount: 1,
  width: 127,
  height: 123,
  anchorX: 0.5,
  anchorY: 0.5,
  fallbackColor: "#6fbf82",
  visualScale: 2.1,
  rippleScale: 0.5,
};

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string): void => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

const getCachedSprite = (sprite: SpriteManifestEntry): SpriteCacheEntry | undefined => {
  if (typeof Image === "undefined") {
    return undefined;
  }

  const existing = spriteCache.get(sprite.src);

  if (existing) {
    return existing;
  }

  const image = new Image();
  const entry: SpriteCacheEntry = {
    image,
    loaded: false,
    failed: false,
  };
  image.onload = () => {
    entry.loaded = true;
  };
  image.onerror = () => {
    entry.failed = true;
  };
  image.src = sprite.src;
  spriteCache.set(sprite.src, entry);

  return entry;
};

const tintedImageFor = (image: HTMLImageElement, sprite: SpriteManifestEntry, tint: string): HTMLCanvasElement | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cacheKey = `${sprite.spriteKey}:${tint}`;
  const existing = tintCanvasCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const tintContext = canvas.getContext("2d");

  if (!tintContext) {
    return undefined;
  }

  tintContext.drawImage(image, 0, 0, sprite.width, sprite.height);
  tintContext.globalCompositeOperation = "source-atop";
  tintContext.fillStyle = tint;
  tintContext.fillRect(0, 0, sprite.width, sprite.height);
  tintCanvasCache.set(cacheKey, canvas);

  return canvas;
};

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: SpriteManifestEntry | undefined,
  pos: Vector,
  vel: Vector,
  radius: number,
  alpha: number,
  tint: string | null = null,
  facingX?: 1 | -1,
  offsetY = 0,
  rotation = 0,
): boolean => {
  if (!sprite) {
    return false;
  }

  const cached = getCachedSprite(sprite);

  if (!cached?.loaded || cached.failed) {
    return false;
  }

  const size = spriteDrawSize(sprite, radius);
  const flip = facingX ?? (vel.x < -0.18 ? -1 : 1);
  const x = -size.width * sprite.anchorX;
  const y = -size.height * sprite.anchorY;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(pos.x, pos.y + offsetY);
  ctx.rotate(rotation);
  ctx.scale(flip, 1);
  ctx.drawImage(tint ? (tintedImageFor(cached.image, sprite, tint) ?? cached.image) : cached.image, x, y, size.width, size.height);

  ctx.restore();

  return true;
};

const sharkNames: Record<Shark["kind"], string> = {
  basic: "Norman",
  fast: "Steezy",
  center: "Bill",
  barracuda: "Grog",
  eel: "Eel",
};

const sharkTintFor = (shark: Shark): string | null => {
  if (shark.starved || shark.health <= 0) {
    return "rgba(135, 152, 164, 0.58)";
  }

  const healthRatio = shark.health / Math.max(1, shark.maxHealth);

  if (healthRatio < 0.35) {
    return "rgba(210, 72, 84, 0.34)";
  }

  if (healthRatio < 0.68) {
    return "rgba(210, 157, 82, 0.22)";
  }

  return null;
};

const drawSharkAccessory = (ctx: CanvasRenderingContext2D, shark: Shark, bodyWidth: number, bodyHeight: number): void => {
  const flip = shark.facingX ?? (shark.vel.x < -0.18 ? -1 : 1);
  const headX = shark.pos.x + flip * bodyWidth * 0.23;
  const topY = shark.pos.y - bodyHeight * 0.28;

  ctx.save();
  ctx.lineWidth = 2;

  if (sharkNames[shark.kind] === "Grog") {
    ctx.fillStyle = "#2f2630";
    ctx.strokeStyle = "#d8c27a";
    ctx.fillRect(headX - 8, topY - 8, 16, 8);
    ctx.beginPath();
    ctx.moveTo(headX - 12, topY);
    ctx.lineTo(headX + 12, topY);
    ctx.stroke();
  }

  if (sharkNames[shark.kind] === "Steezy") {
    ctx.strokeStyle = "#d8c27a";
    ctx.beginPath();
    ctx.arc(headX + flip * 5, shark.pos.y + bodyHeight * 0.08, 4, 0.3, Math.PI * 1.35);
    ctx.stroke();
  }

  if (sharkNames[shark.kind] === "Bill") {
    ctx.fillStyle = "#6f7c89";
    ctx.beginPath();
    ctx.moveTo(headX + flip * 10, shark.pos.y - 2);
    ctx.lineTo(headX + flip * 22, shark.pos.y + 4);
    ctx.lineTo(headX + flip * 9, shark.pos.y + 8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
};

const drawSharkShape = (ctx: CanvasRenderingContext2D, shark: Shark): void => {
  const sharkSprite = getSharkSprite(shark.kind);
  const tint = sharkTintFor(shark);
  const alpha = shark.starved ? 0.68 : 1;
  const drewSprite = drawSprite(ctx, sharkSprite, shark.pos, shark.vel, shark.radius, alpha, tint, shark.facingX);

  if (drewSprite) {
    return;
  }

  if (shark.kind === "barracuda") {
    ctx.fillStyle = tint ?? "#151a20";
    ctx.beginPath();
    ctx.ellipse(shark.pos.x, shark.pos.y, shark.radius * 1.35, shark.radius * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawCircle(ctx, shark.pos.x, shark.pos.y, shark.radius, tint ?? "#151a20");
  }

  ctx.strokeStyle = shark.starved ? "#aeb7c2" : "#5b6470";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(shark.pos.x, shark.pos.y, shark.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;

  if (shark.kind === "fast") {
    ctx.strokeStyle = "#8f9aa7";
    ctx.beginPath();
    ctx.moveTo(shark.pos.x + shark.radius + 4, shark.pos.y - 7);
    ctx.lineTo(shark.pos.x + shark.radius + 14, shark.pos.y);
    ctx.lineTo(shark.pos.x + shark.radius + 4, shark.pos.y + 7);
    ctx.stroke();
  }

  if (shark.kind === "center") {
    drawCircle(ctx, shark.pos.x, shark.pos.y, 3, "#8f9aa7");
  }

  drawSharkAccessory(ctx, shark, shark.kind === "barracuda" ? shark.radius * 2.7 : shark.radius * 2, shark.kind === "barracuda" ? shark.radius * 1.04 : shark.radius * 2);
};

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#00040a");
  gradient.addColorStop(0.34, "#03181b");
  gradient.addColorStop(0.68, "#0a1025");
  gradient.addColorStop(1, "#010207");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const drawWaterShade = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  const drift = Math.sin(time * 0.00028) * width * 0.08;
  const shade = ctx.createLinearGradient(drift, 0, width + drift, height);
  shade.addColorStop(0, "rgba(18, 77, 70, 0.12)");
  shade.addColorStop(0.45, "rgba(20, 55, 78, 0.1)");
  shade.addColorStop(0.72, "rgba(22, 16, 45, 0.18)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.32)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
};

const drawWaveBands = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  for (let band = 0; band < 7; band += 1) {
    const yBase = height * (0.18 + band * 0.16);
    const bandHeight = 16 + band * 1.8;
    const drift = (time * (0.009 + band * 0.0015) + band * 41) % (width + 160);

    ctx.fillStyle = band % 2 === 0 ? "rgba(47, 122, 114, 0.064)" : "rgba(82, 88, 135, 0.056)";
    ctx.beginPath();

    for (let step = -160; step <= width + 160; step += 34) {
      const x = step + drift - 120;
      const y = yBase + Math.sin(time * 0.00085 + step * 0.024 + band) * (7 + band);

      if (step === -160) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    for (let step = width + 160; step >= -160; step -= 34) {
      const x = step + drift - 120;
      const y = yBase + bandHeight + Math.sin(time * 0.00075 + step * 0.02 + band + 2.1) * (5 + band * 0.8);
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
  }
};

const drawWaveGlowFields = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let band = 0; band < 8; band += 1) {
    const yBase = ((band + 1) / 9) * height;
    const drift = (time * (0.01 + band * 0.001) + band * 61) % (width + 220);
    const x = drift - 110;
    const y = yBase + Math.sin(time * 0.00055 + band) * 18;
    const radiusX = width * (0.28 + band * 0.018);
    const radiusY = 18 + band * 2.5;

    ctx.fillStyle = band % 2 === 0 ? "rgba(108, 196, 186, 0.045)" : "rgba(116, 126, 186, 0.04)";
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, Math.sin(band) * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - width * 0.52, y + radiusY * 0.45, radiusX * 0.82, radiusY * 0.72, -0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

const drawKelpGoal = (ctx: CanvasRenderingContext2D, goal: KelpGoal | null | undefined, time: number): void => {
  if (!goal) {
    return;
  }

  const bob = Math.sin(time * 0.0018 + goal.pos.x * 0.01) * 2;

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.fillStyle = "rgba(76, 150, 112, 0.16)";
  ctx.ellipse(goal.pos.x, goal.pos.y + 10, goal.radius * 1.35, goal.radius * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!drawSprite(ctx, kelpSprite, { x: goal.pos.x, y: goal.pos.y + bob }, { x: 0, y: 0 }, goal.radius, 1)) {
    drawCircle(ctx, goal.pos.x, goal.pos.y + bob, goal.radius * 0.5, "#6fbf82");
  }

  ctx.restore();
};

export const drawCombat = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  run: RunState,
  config: LevelConfig,
  fish: Fish[],
  sharks: Shark[],
  waterDisturbance?: WaterDisturbanceField,
  time = 0,
  kelpGoal?: KelpGoal | null,
): void => {
  drawBackground(ctx, width, height);
  drawWaterShade(ctx, width - hudWidth(), height, time);
  drawWaveBands(ctx, width - hudWidth(), height, time);
  drawWaveGlowFields(ctx, width - hudWidth(), height, time);
  waterDisturbance?.draw(ctx);
  drawKelpGoal(ctx, kelpGoal, time);

  for (const candidate of fish) {
    if (candidate.caught && (candidate.caughtTimer ?? 0) <= 0) {
      continue;
    }

    const definition = candidate.typeId === "support" ? null : fishTypes[candidate.typeId as ActiveFishTypeId];
    const fill = candidate.threatened ? "#ff4058" : (definition?.color ?? "#ffffff");
    const fade = candidate.caught ? Math.max(0.16, Math.min(1, (candidate.caughtTimer ?? 0) / CAUGHT_FADE_SECONDS)) : 1;
    const pose = swimPoseForFish(candidate, time);
    ctx.save();
    ctx.globalAlpha = fade;
    const sprite = getFishSprite(candidate.typeId);
    const tint = candidate.threatened ? "rgba(255, 42, 68, 0.32)" : null;

    if (!drawSprite(ctx, sprite, candidate.pos, candidate.vel, candidate.radius, 1, tint, candidate.facingX, pose.offsetY, pose.rotation)) {
      drawCircle(ctx, candidate.pos.x, candidate.pos.y + pose.offsetY, candidate.radius, fill);
    }

    if (candidate.kind === "support") {
      ctx.strokeStyle = "#4daac2";
      ctx.beginPath();
      ctx.arc(candidate.pos.x, candidate.pos.y + pose.offsetY, candidate.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const shark of sharks) {
    if (!isVisibleShark(shark)) {
      continue;
    }

    drawSharkShape(ctx, shark);
  }

  drawHud(ctx, width, height, run, config, sharks, fish);
};

export const drawIdleScene = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  drawBackground(ctx, width, height);
  drawWaterShade(ctx, width - hudWidth(), height, time);
  drawWaveBands(ctx, width - hudWidth(), height, time);
  drawWaveGlowFields(ctx, width - hudWidth(), height, time);

  const usableWidth = width - hudWidth();
  const previewFish = [
    "tilapia",
    "salmon",
    "tilapia",
    "parrotfish",
    "mahi-mahi",
    "tilapia",
    "salmon",
    "grouper",
    "parrotfish",
    "tilapia",
    "mahi-mahi",
    "salmon",
  ] as ActiveFishTypeId[];

  for (let index = 0; index < previewFish.length; index += 1) {
    const typeId = previewFish[index];
    const lane = index % 4;
    const angle = time * (0.00026 + lane * 0.000025) + index * 0.72;
    const loop = (time * (0.018 + lane * 0.003) + index * 64) % (usableWidth + 180);
    const direction = lane % 2 === 0 ? 1 : -1;
    const x = direction === 1 ? loop - 90 : usableWidth + 90 - loop;
    const y = height * (0.34 + lane * 0.1) + Math.sin(angle * 1.22) * (18 + (index % 3) * 5);
    const definition = fishTypes[typeId];
    const pos = { x, y };
    const vel = { x: direction, y: Math.sin(angle) * 0.2 };

    if (!drawSprite(ctx, getFishSprite(typeId), pos, vel, definition.radius + (typeId === "grouper" ? 4 : 3), 1, null, direction as 1 | -1)) {
      drawCircle(ctx, x, y, definition.radius + 2, definition.color);
    }
  }

  const sharkPos = { x: usableWidth * 0.72, y: height * 0.48 };
  const sharkVel = { x: -1, y: 0 };

  if (!drawSprite(ctx, getSharkSprite("basic"), sharkPos, sharkVel, 30, 1, null, -1)) {
    drawCircle(ctx, sharkPos.x, sharkPos.y, 30, "#151a20");
  }
};
