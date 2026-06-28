import type { Fish, FishTypeId, LevelConfig, RunState, Shark } from "../game/types";
import { summarizeSharks } from "../entities/Shark";
import { fishTypes } from "../systems/fishTypes";
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

type FishTypeSummary = {
  typeId: FishTypeId;
  alive: Fish[];
};

const summarizeFish = (fish: Fish[]): FishTypeSummary[] => {
  const summaries = new Map<FishTypeId, Fish[]>();

  for (const candidate of fish.filter((item) => !item.caught)) {
    summaries.set(candidate.typeId, [...(summaries.get(candidate.typeId) ?? []), candidate]);
  }

  return Array.from(summaries.entries()).map(([typeId, alive]) => ({ typeId, alive }));
};

const drawFishPips = (ctx: CanvasRenderingContext2D, fish: Fish[], x: number, y: number, color: string): void => {
  fish.slice(0, 12).forEach((candidate, index) => {
    const pipX = x + (index % 6) * 13;
    const pipY = y + Math.floor(index / 6) * 9;
    drawBar(ctx, pipX, pipY, 10, 5, candidate.health / candidate.maxHealth, color);
  });

  if (fish.length > 12) {
    ctx.fillStyle = "#8f9aa7";
    ctx.fillText("+", x + 80, y + 6);
  }
};

const pathY = 64;

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
  ctx.fillText(`Shells ${run.currency}`, x + 18, 43);

  drawBar(ctx, x + 18, 58, 132, 9, run.schoolEnergy / 110, "#e8f4ff");

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
  ctx.fillText("Fish", x + 18, 116);

  summarizeFish(fish).forEach((summary, index) => {
    const definition = fishTypes[summary.typeId];
    const rowY = 134 + index * 27;
    ctx.fillStyle = definition.color;
    ctx.beginPath();
    ctx.arc(x + 25, rowY + 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`${definition.label} ${summary.alive.length}`, x + 39, rowY + 6);
    drawFishPips(ctx, summary.alive, x + 18, rowY + 12, definition.color);
  });

  const enemyY = 146 + summarizeFish(fish).length * 27;
  ctx.fillStyle = "#8f9aa7";
  ctx.fillText("Sharks", x + 18, enemyY);

  summarizeSharks(sharks).forEach((summary, index) => {
    const rowY = enemyY + 19 + index * 28;
    sharkMark(ctx, summary.kind, x + 28, rowY + 3);
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`x${summary.count}`, x + 47, rowY + 7);
    drawBar(ctx, x + 78, rowY, 72, 8, summary.totalHunger / Math.max(1, summary.maxHunger), "#6f7c8b");
  });
};
