import type { Fish, LevelConfig, Ripple, RunState, Shark, SpriteManifestEntry, Vector } from "../game/types";
import { getFishSprite, getSharkSprite, spriteDrawSize } from "./sprites";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";
import { drawHud, hudWidth } from "../ui/hud";

type SpriteCacheEntry = {
  image: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
};

const spriteCache = new Map<string, SpriteCacheEntry>();

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

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: SpriteManifestEntry | undefined,
  pos: Vector,
  vel: Vector,
  radius: number,
  alpha: number,
  tint: string | null = null,
): boolean => {
  if (!sprite) {
    return false;
  }

  const cached = getCachedSprite(sprite);

  if (!cached?.loaded || cached.failed) {
    return false;
  }

  const size = spriteDrawSize(sprite, radius);
  const flip = vel.x < -0.05 ? -1 : 1;
  const x = -size.width * sprite.anchorX;
  const y = -size.height * sprite.anchorY;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(pos.x, pos.y);
  ctx.scale(flip, 1);
  ctx.drawImage(cached.image, x, y, size.width, size.height);

  if (tint) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, size.width, size.height);
  }

  ctx.restore();

  return true;
};

const drawSharkShape = (ctx: CanvasRenderingContext2D, shark: Shark): void => {
  const drewSprite = drawSprite(ctx, getSharkSprite(shark.kind), shark.pos, shark.vel, shark.radius, 1, shark.starved ? "rgba(190, 205, 220, 0.28)" : null);

  if (drewSprite) {
    if (shark.starved) {
      ctx.strokeStyle = "#e8f4ff";
      ctx.lineWidth = 2;
      const eyeY = shark.pos.y - shark.radius * 0.22;
      for (const eyeX of [shark.pos.x - shark.radius * 0.28, shark.pos.x + shark.radius * 0.24]) {
        ctx.beginPath();
        ctx.moveTo(eyeX - 4, eyeY - 4);
        ctx.lineTo(eyeX + 4, eyeY + 4);
        ctx.moveTo(eyeX + 4, eyeY - 4);
        ctx.lineTo(eyeX - 4, eyeY + 4);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }

    return;
  }

  if (shark.kind === "barracuda") {
    ctx.fillStyle = "#151a20";
    ctx.beginPath();
    ctx.ellipse(shark.pos.x, shark.pos.y, shark.radius * 1.35, shark.radius * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawCircle(ctx, shark.pos.x, shark.pos.y, shark.radius, "#151a20");
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

  if (shark.starved) {
    ctx.strokeStyle = "#e8f4ff";
    ctx.lineWidth = 2;
    const eyeY = shark.pos.y - shark.radius * 0.25;
    for (const eyeX of [shark.pos.x - shark.radius * 0.3, shark.pos.x + shark.radius * 0.3]) {
      ctx.beginPath();
      ctx.moveTo(eyeX - 4, eyeY - 4);
      ctx.lineTo(eyeX + 4, eyeY + 4);
      ctx.moveTo(eyeX + 4, eyeY - 4);
      ctx.lineTo(eyeX - 4, eyeY + 4);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
};

const drawWaterRipples = (ctx: CanvasRenderingContext2D, ripples: Ripple[], time: number): void => {
  for (const ripple of ripples) {
    const wobble = Math.sin(time * 0.002 + ripple.x * 0.013 + ripple.y * 0.017) * 0.08;
    ctx.save();
    ctx.translate(ripple.x, ripple.y);
    ctx.scale(ripple.scaleX + wobble, ripple.scaleY - wobble * 0.35);
    ctx.globalAlpha = Math.max(0, ripple.opacity);
    ctx.strokeStyle = "rgba(126, 199, 235, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, ripple.radius, ripple.radius, 0, Math.PI * 0.05, Math.PI * 1.95);
    ctx.stroke();

    if (ripple.radius > 12) {
      ctx.globalAlpha = Math.max(0, ripple.opacity * 0.42);
      ctx.beginPath();
      ctx.ellipse(0, 0, ripple.radius * 0.62, ripple.radius * 0.62, 0, Math.PI * 0.22, Math.PI * 1.48);
      ctx.stroke();
    }

    ctx.restore();
  }
};

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#010205");
  gradient.addColorStop(0.32, "#07111c");
  gradient.addColorStop(0.7, "#0b0712");
  gradient.addColorStop(1, "#11151b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const drawWaterShade = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  const pulse = (Math.sin(time * 0.00035) + 1) * 0.5;
  const x = width * (0.28 + pulse * 0.24);
  const y = height * (0.34 + (1 - pulse) * 0.18);
  const glow = ctx.createRadialGradient(x, y, 40, x, y, Math.max(width, height) * 0.9);
  glow.addColorStop(0, "rgba(42, 70, 94, 0.18)");
  glow.addColorStop(0.46, "rgba(35, 42, 74, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
};

const drawWaterCurrents = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  ctx.lineWidth = 1;

  for (let band = 0; band < 7; band += 1) {
    const yBase = ((band + 1) / 8) * height;
    const drift = (time * 0.012 + band * 57) % (width + 180);
    ctx.strokeStyle = band % 2 === 0 ? "rgba(112, 144, 174, 0.08)" : "rgba(93, 84, 125, 0.07)";
    ctx.beginPath();

    for (let step = -180; step <= width + 20; step += 28) {
      const x = step + drift - 120;
      const y = yBase + Math.sin(time * 0.0009 + step * 0.025 + band) * 8;

      if (step === -180) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }
};

export const drawCombat = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  run: RunState,
  config: LevelConfig,
  fish: Fish[],
  sharks: Shark[],
  ripples: Ripple[] = [],
  time = 0,
): void => {
  drawBackground(ctx, width, height);
  drawWaterShade(ctx, width - hudWidth(), height, time);
  drawWaterCurrents(ctx, width - hudWidth(), height, time);
  drawWaterRipples(ctx, ripples, time);

  for (const candidate of fish) {
    if (candidate.caught && (candidate.caughtTimer ?? 0) <= 0) {
      continue;
    }

    const definition = candidate.typeId === "support" ? null : fishTypes[candidate.typeId as ActiveFishTypeId];
    const fill = candidate.threatened ? "#ff4058" : (definition?.color ?? "#ffffff");
    const fade = candidate.caught ? Math.max(0.16, Math.min(1, (candidate.caughtTimer ?? 0) / 0.32)) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    const sprite = getFishSprite(candidate.typeId);
    const tint = candidate.threatened ? "rgba(255, 42, 68, 0.32)" : null;

    if (!drawSprite(ctx, sprite, candidate.pos, candidate.vel, candidate.radius, 1, tint)) {
      drawCircle(ctx, candidate.pos.x, candidate.pos.y, candidate.radius, fill);
    }

    if (candidate.kind === "support") {
      ctx.strokeStyle = "#4daac2";
      ctx.beginPath();
      ctx.arc(candidate.pos.x, candidate.pos.y, candidate.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const shark of sharks) {
    if (shark.health <= 0 && !shark.starved) {
      continue;
    }

    drawSharkShape(ctx, shark);
  }

  drawHud(ctx, width, height, run, config, sharks, fish);
};

export const drawIdleScene = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
  drawBackground(ctx, width, height);
  drawWaterShade(ctx, width - hudWidth(), height, time);
  drawWaterCurrents(ctx, width - hudWidth(), height, time);

  const usableWidth = width - hudWidth();

  for (let index = 0; index < 34; index += 1) {
    const angle = time * 0.0004 + index * 0.72;
    const x = usableWidth * 0.48 + Math.cos(angle) * (42 + (index % 6) * 12);
    const y = height * 0.5 + Math.sin(angle * 1.2) * (28 + (index % 5) * 10);
    drawCircle(ctx, x, y, 3.5, "#ffffff");
  }

  drawCircle(ctx, usableWidth * 0.76, height * 0.48, 27, "#151a20");
};
