import type { Fish, LevelConfig, RunState, Shark } from "../game/types";
import { summarizeSharks } from "../entities/Shark";
import { createLevelPathPreview } from "../systems/levels";

const PANEL_WIDTH = 188;

const drawBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  ratio: number,
  fill: string,
): void => {
  ctx.fillStyle = "#101318";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), height);
  ctx.strokeStyle = "#313740";
  ctx.strokeRect(x, y, width, height);
};

export const hudWidth = (): number => PANEL_WIDTH;

const sharkMark = (ctx: CanvasRenderingContext2D, kind: Shark["kind"], x: number, y: number): void => {
  ctx.fillStyle = "#151a20";
  ctx.strokeStyle = "#66717f";
  ctx.beginPath();

  if (kind === "barracuda") {
    ctx.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2);
  } else if (kind === "eel") {
    ctx.arc(x - 4, y, 7, -0.8, 1.8);
  } else {
    ctx.arc(x, y, 7, 0, Math.PI * 2);
  }

  ctx.fill();
  ctx.stroke();

  if (kind === "fast") {
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 5);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 9, y + 5);
    ctx.stroke();
  }

  if (kind === "center") {
    ctx.fillStyle = "#8f9aa7";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

const pathY = 88;

export const drawHud = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  run: RunState,
  config: LevelConfig,
  sharks: Shark[],
  fish: Fish[],
): void => {
  const x = width - PANEL_WIDTH;

  ctx.fillStyle = "#05070a";
  ctx.fillRect(x, 0, PANEL_WIDTH, height);
  ctx.strokeStyle = "#1e252d";
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.fillStyle = "#f8fbff";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(`L ${config.level}`, x + 18, 28);
  ctx.fillText(`Fish ${fish.filter((candidate) => !candidate.caught).length}`, x + 72, 28);

  drawBar(ctx, x + 18, 47, 132, 9, run.schoolEnergy / 110, "#e8f4ff");
  ctx.fillStyle = "#8f9aa7";
  ctx.fillText("Energy", x + 18, 73);

  ctx.fillStyle = "#8f9aa7";
  ctx.fillText("Path", x + 18, pathY);

  createLevelPathPreview(config.level, 5).forEach((step, index) => {
    const stepX = x + 20 + index * 27;
    ctx.fillStyle = step.current ? "#f8fbff" : "#65717f";
    ctx.beginPath();
    ctx.arc(stepX, pathY + 19, step.current ? 9 : 7, 0, Math.PI * 2);
    ctx.strokeStyle = step.current ? "#f8fbff" : "#38414b";
    ctx.stroke();
    ctx.fillText(step.icon, stepX - 3, pathY + 23);
  });

  ctx.fillStyle = "#8f9aa7";
  ctx.fillText("Enemies", x + 18, 143);

  summarizeSharks(sharks).forEach((summary, index) => {
    const rowY = 162 + index * 28;
    sharkMark(ctx, summary.kind, x + 28, rowY + 3);
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`x${summary.count}`, x + 47, rowY + 7);
    drawBar(ctx, x + 78, rowY, 72, 8, summary.totalHunger / Math.max(1, summary.maxHunger), "#6f7c8b");
  });

  const supportFish = fish.filter((candidate) => candidate.kind === "support" && !candidate.caught);

  if (supportFish.length > 0) {
    const supportY = 178 + summarizeSharks(sharks).length * 28;
    ctx.fillStyle = "#8f9aa7";
    ctx.fillText("Support", x + 18, supportY);

    supportFish.forEach((support, index) => {
      drawBar(ctx, x + 18, supportY + 14 + index * 18, 132, 8, support.health / support.maxHealth, "#9de7ff");
    });
  }
};
