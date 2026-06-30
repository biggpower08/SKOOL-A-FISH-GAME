import type { Fish, LevelConfig, RunState, Shark } from "../game/types";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";
import { drawHud, hudWidth } from "../ui/hud";

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string): void => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

const drawEntityWake = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  velX: number,
  velY: number,
  radius: number,
  opacity: number,
  time: number,
): void => {
  const speed = Math.hypot(velX, velY);

  if (speed < 0.12) {
    return;
  }

  const angle = Math.atan2(velY, velX);
  const drift = Math.sin(time * 0.006 + x * 0.03 + y * 0.02) * 1.6;
  ctx.save();
  ctx.translate(x - Math.cos(angle) * radius * 0.75, y - Math.sin(angle) * radius * 0.75);
  ctx.rotate(angle);
  ctx.strokeStyle = `rgba(154, 190, 220, ${opacity})`;
  ctx.lineWidth = Math.max(1, radius * 0.07);

  for (let index = 0; index < 3; index += 1) {
    const wakeScale = 1 + index * 0.42;
    ctx.beginPath();
    ctx.ellipse(
      -radius * (0.55 + index * 0.42),
      drift * (index + 1),
      radius * (0.7 + wakeScale * 0.18),
      radius * (0.12 + index * 0.05),
      0,
      Math.PI * 0.12,
      Math.PI * 0.88,
    );
    ctx.stroke();
  }

  ctx.restore();
};

const drawSharkShape = (ctx: CanvasRenderingContext2D, shark: Shark): void => {
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
  time = 0,
): void => {
  drawBackground(ctx, width, height);
  drawWaterShade(ctx, width - hudWidth(), height, time);
  drawWaterCurrents(ctx, width - hudWidth(), height, time);

  for (let index = 0; index < fish.length; index += 1) {
    const candidate = fish[index];

    if (candidate.caught && (candidate.caughtTimer ?? 0) <= 0) {
      continue;
    }

    if (index % 4 !== 0 && !candidate.threatened && !candidate.caught) {
      continue;
    }

    drawEntityWake(ctx, candidate.pos.x, candidate.pos.y, candidate.vel.x, candidate.vel.y, candidate.radius, candidate.threatened ? 0.13 : 0.06, time);
  }

  for (const shark of sharks) {
    if (shark.health <= 0 && !shark.starved) {
      continue;
    }

    drawEntityWake(ctx, shark.pos.x, shark.pos.y, shark.vel.x, shark.vel.y, shark.radius, shark.starved ? 0.04 : 0.16, time);
  }

  for (const candidate of fish) {
    if (candidate.caught && (candidate.caughtTimer ?? 0) <= 0) {
      continue;
    }

    const definition = candidate.typeId === "support" ? null : fishTypes[candidate.typeId as ActiveFishTypeId];
    const fill = candidate.threatened ? "#ff4058" : (definition?.color ?? "#ffffff");
    const fade = candidate.caught ? Math.max(0.16, Math.min(1, (candidate.caughtTimer ?? 0) / 0.32)) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    drawCircle(ctx, candidate.pos.x, candidate.pos.y, candidate.radius, fill);

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
