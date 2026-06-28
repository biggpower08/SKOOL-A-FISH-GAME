import type { Fish, LevelConfig, RunState, Shark } from "../game/types";
import { drawHud, hudWidth } from "../ui/hud";

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string): void => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

const drawAmbientRipple = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number,
  opacity: number,
): void => {
  const pulse = (Math.sin(time * 0.004 + radius) + 1) * 0.5;
  ctx.strokeStyle = `rgba(155, 206, 235, ${opacity * (0.45 + pulse * 0.55)})`;
  ctx.beginPath();
  ctx.arc(x, y, radius + pulse * radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();
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
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
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

  for (const shark of sharks) {
    if (shark.health <= 0 && !shark.starved) {
      continue;
    }

    drawAmbientRipple(ctx, shark.pos.x, shark.pos.y, shark.radius * 1.7, time, 0.12);
  }

  fish.forEach((candidate, index) => {
    if (candidate.caught || index % 3 !== 0) {
      return;
    }

    drawAmbientRipple(ctx, candidate.pos.x, candidate.pos.y, candidate.radius * 2.8, time + index * 19, 0.035);
  });

  for (const candidate of fish) {
    if (candidate.caught) {
      continue;
    }

    const fill = candidate.threatened ? "#ff4058" : candidate.kind === "support" ? "#bdefff" : "#ffffff";
    drawCircle(ctx, candidate.pos.x, candidate.pos.y, candidate.radius, fill);

    if (candidate.kind === "support") {
      ctx.strokeStyle = "#4daac2";
      ctx.beginPath();
      ctx.arc(candidate.pos.x, candidate.pos.y, candidate.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
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

  const usableWidth = width - hudWidth();

  for (let index = 0; index < 34; index += 1) {
    const angle = time * 0.0004 + index * 0.72;
    const x = usableWidth * 0.48 + Math.cos(angle) * (42 + (index % 6) * 12);
    const y = height * 0.5 + Math.sin(angle * 1.2) * (28 + (index % 5) * 10);
    if (index % 3 === 0) {
      drawAmbientRipple(ctx, x, y, 10, time + index * 11, 0.03);
    }
    drawCircle(ctx, x, y, 3.5, "#ffffff");
  }

  drawAmbientRipple(ctx, usableWidth * 0.76, height * 0.48, 44, time, 0.1);
  drawCircle(ctx, usableWidth * 0.76, height * 0.48, 27, "#151a20");
};
