import type { Fish, LevelConfig, RunState, Shark } from "../game/types";
import { summarizeSharks } from "../entities/Shark";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";
import { getFishSprite, getSharkSprite } from "../rendering/sprites";
import type { SpriteManifestEntry } from "../game/types";

const PANEL_WIDTH = 164;
const BUILD_LABEL = "v0.1.0 ocean-recruit";

type HudSpriteCacheEntry = {
  image: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
};

const hudSpriteCache = new Map<string, HudSpriteCacheEntry>();

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

const getHudSprite = (sprite: SpriteManifestEntry): HudSpriteCacheEntry | undefined => {
  if (typeof Image === "undefined") {
    return undefined;
  }

  const existing = hudSpriteCache.get(sprite.src);

  if (existing) {
    return existing;
  }

  const image = new Image();
  const entry: HudSpriteCacheEntry = {
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
  hudSpriteCache.set(sprite.src, entry);

  return entry;
};

const drawHudThumbnail = (
  ctx: CanvasRenderingContext2D,
  sprite: SpriteManifestEntry | undefined,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): boolean => {
  if (!sprite) {
    return false;
  }

  const cached = getHudSprite(sprite);

  if (!cached?.loaded || cached.failed) {
    return false;
  }

  const ratio = sprite.width / sprite.height;
  const width = ratio >= 1 ? maxWidth : maxHeight * ratio;
  const height = ratio >= 1 ? maxWidth / ratio : maxHeight;

  ctx.drawImage(cached.image, x - width / 2, y - height / 2, width, height);
  return true;
};

const fallbackFishMark = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
};

const sharkMark = (ctx: CanvasRenderingContext2D, kind: Shark["kind"], x: number, y: number): void => {
  if (drawHudThumbnail(ctx, getSharkSprite(kind), x + 1, y, 28, 16)) {
    return;
  }

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
  typeId: ActiveFishTypeId;
  alive: Fish[];
};

const summarizeFish = (fish: Fish[]): FishTypeSummary[] => {
  const summaries = new Map<ActiveFishTypeId, Fish[]>();

  for (const candidate of fish.filter((item) => !item.caught && item.typeId !== "support")) {
    const typeId = candidate.typeId as ActiveFishTypeId;
    summaries.set(typeId, [...(summaries.get(typeId) ?? []), candidate]);
  }

  return Array.from(summaries.entries()).map(([typeId, alive]) => ({ typeId, alive }));
};

const groupHealthRatio = (fish: Fish[]): number => {
  const maxHealth = fish.reduce((sum, candidate) => sum + Math.max(1, candidate.maxHealth), 0);
  const health = fish.reduce((sum, candidate) => sum + Math.max(0, candidate.health), 0);
  return maxHealth === 0 ? 0 : health / maxHealth;
};

const FISH_ROW_HEIGHT = 28;
const sharkLabels: Record<Shark["kind"], string> = {
  basic: "Norman",
  fast: "Steezy",
  center: "Bill",
  barracuda: "Grog",
  eel: "Eel",
};

export const schoolCounterText = (fish: Fish[], run: Pick<RunState, "fishCount" | "maxFishCount">): string => {
  const live = fish.filter((candidate) => !candidate.caught).length;
  const total = Math.max(live, run.fishCount, run.maxFishCount);

  return `Fish ${live} / ${total}`;
};

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
  ctx.fillText(`L${config.level}`, x + 14, 26);
  ctx.fillText(schoolCounterText(fish, run), x + 52, 26);
  ctx.fillText(`Shells ${run.currency}`, x + 14, 43);

  const feedback = run.lastRecoverySummary || run.lastRecruitmentSummary;
  const schoolY = feedback ? 86 : 70;

  if (feedback) {
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(feedback.slice(0, 28), x + 14, 64);
  }

  ctx.fillStyle = "#8f9aa7";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("School", x + 14, schoolY);

  summarizeFish(fish).forEach((summary, index) => {
    const definition = fishTypes[summary.typeId];
    const rowY = schoolY + 18 + index * FISH_ROW_HEIGHT;
    if (!drawHudThumbnail(ctx, getFishSprite(summary.typeId), x + 22, rowY + 4, 24, 15)) {
      fallbackFishMark(ctx, x + 22, rowY + 4, definition.color);
    }
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`${definition.label} ${summary.alive.length}`, x + 41, rowY + 8);
    drawBar(ctx, x + 41, rowY + 14, 92, 5, groupHealthRatio(summary.alive), definition.color);
  });

  const enemyY = schoolY + 30 + summarizeFish(fish).length * FISH_ROW_HEIGHT;
  ctx.fillStyle = "#8f9aa7";
  ctx.fillText("Sharks", x + 14, enemyY);

  summarizeSharks(sharks).forEach((summary, index) => {
    const rowY = enemyY + 17 + index * 31;
    sharkMark(ctx, summary.kind, x + 23, rowY + 4);
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`${sharkLabels[summary.kind]} ${summary.count}`, x + 41, rowY + 2);
    drawBar(ctx, x + 41, rowY + 8, 92, 5, summary.totalHealth / summary.maxHealth, "#d8e1ea");
    drawBar(ctx, x + 41, rowY + 16, 92, 5, summary.totalHunger / summary.maxHunger, "#5f7186");
  });

  ctx.fillStyle = "#6f7c89";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(BUILD_LABEL, x + 14, height - 16);
};
