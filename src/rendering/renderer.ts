import type { Fish, LevelConfig, RunState, Shark } from "../game/types";
import { drawHud, hudWidth } from "../ui/hud";

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string): void => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
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
): void => {
  drawBackground(ctx, width, height);

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
    if (shark.health <= 0) {
      continue;
    }

    drawCircle(ctx, shark.pos.x, shark.pos.y, shark.radius, "#151a20");
    ctx.strokeStyle = "#5b6470";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shark.pos.x, shark.pos.y, shark.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
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
    drawCircle(ctx, x, y, 3.5, "#ffffff");
  }

  drawCircle(ctx, usableWidth * 0.76, height * 0.48, 27, "#151a20");
};
