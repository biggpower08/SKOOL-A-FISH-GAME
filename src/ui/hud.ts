import type { Fish, LevelConfig, RunState, Shark } from "../game/types";

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
  ctx.fillText("Sharks", x + 18, 108);

  sharks.forEach((shark, index) => {
    drawBar(ctx, x + 18, 122 + index * 20, 132, 8, shark.health / shark.maxHealth, "#6f7c8b");
  });

  const supportFish = fish.filter((candidate) => candidate.kind === "support" && !candidate.caught);

  if (supportFish.length > 0) {
    const supportY = 140 + sharks.length * 20;
    ctx.fillStyle = "#8f9aa7";
    ctx.fillText("Support", x + 18, supportY);

    supportFish.forEach((support, index) => {
      drawBar(ctx, x + 18, supportY + 14 + index * 18, 132, 8, support.health / support.maxHealth, "#9de7ff");
    });
  }
};
