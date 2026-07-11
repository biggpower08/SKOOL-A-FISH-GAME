import type { Fish, LevelConfig, RunState, Shark } from "../game/types";
import { summarizeSharks } from "../entities/Shark";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";
import { getFishSprite, getSharkSprite } from "../rendering/sprites";
import { uiIconAssets } from "../rendering/assetPaths";
import type { SpriteManifestEntry } from "../game/types";

const PANEL_WIDTH = 164;
const COMPACT_PANEL_WIDTH = 104;

type HudSpriteCacheEntry = {
  image: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
};

const hudSpriteCache = new Map<string, HudSpriteCacheEntry>();

type HudImageSource = Pick<SpriteManifestEntry, "src" | "width" | "height">;

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

export const hudWidth = (viewportWidth = 960): number => (viewportWidth < 520 ? COMPACT_PANEL_WIDTH : PANEL_WIDTH);

const getHudSprite = (sprite: HudImageSource): HudSpriteCacheEntry | undefined => {
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
  sprite: HudImageSource | undefined,
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

const uiIcon = (src: string, width: number, height: number): HudImageSource => ({ src, width, height });

const sharkMark = (ctx: CanvasRenderingContext2D, kind: Shark["kind"], x: number, y: number): void => {
  const maxWidth = kind === "fast" ? 44 : 40;
  const maxHeight = kind === "fast" ? 26 : 24;

  if (drawHudThumbnail(ctx, getSharkSprite(kind), x + 2, y, maxWidth, maxHeight)) {
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

const FISH_ROW_HEIGHT = 34;
const SHARK_ROW_HEIGHT = 34;
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

  return `${live} / ${total}`;
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
  const panelWidth = hudWidth(width);
  const compact = panelWidth < PANEL_WIDTH;
  const x = width - panelWidth;
  const iconX = x + (compact ? 16 : 23);
  const textX = x + (compact ? 32 : 45);
  const barWidth = compact ? 56 : 86;

  ctx.fillStyle = "#05070a";
  ctx.fillRect(x, 0, panelWidth, height);
  ctx.strokeStyle = "#1e252d";
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.fillStyle = "#f8fbff";
  ctx.font = `${compact ? 10 : 12}px system-ui, sans-serif`;
  ctx.fillText(`L${config.level}`, x - 42, 26);
  if (!drawHudThumbnail(ctx, uiIcon(uiIconAssets.fishCounter, 170, 129), iconX, 25, compact ? 24 : 32, compact ? 18 : 24)) {
    fallbackFishMark(ctx, iconX, 24, "#d8e1ea");
  }
  ctx.fillText(schoolCounterText(fish, run), textX, 29);
  drawHudThumbnail(ctx, uiIcon(uiIconAssets.shell, 141, 113), iconX, 50, compact ? 22 : 30, compact ? 18 : 24);
  ctx.fillText(String(run.currency), textX, 54);

  const schoolY = 88;

  ctx.font = `${compact ? 9 : 12}px system-ui, sans-serif`;

  summarizeFish(fish).forEach((summary, index) => {
    const definition = fishTypes[summary.typeId];
    const rowY = schoolY + index * FISH_ROW_HEIGHT;
    if (!drawHudThumbnail(ctx, getFishSprite(summary.typeId), iconX, rowY + 8, compact ? 26 : 36, compact ? 18 : 24)) {
      fallbackFishMark(ctx, iconX, rowY + 8, definition.color);
    }
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`${compact ? definition.label.slice(0, 5) : definition.label} ${summary.alive.length}`, textX, rowY + 7);
    drawBar(ctx, textX, rowY + 17, barWidth, 5, groupHealthRatio(summary.alive), definition.color);
  });

  const enemyY = schoolY + 18 + summarizeFish(fish).length * FISH_ROW_HEIGHT;

  summarizeSharks(sharks).forEach((summary, index) => {
    const rowY = enemyY + index * SHARK_ROW_HEIGHT;
    sharkMark(ctx, summary.kind, iconX, rowY + 7);
    ctx.fillStyle = "#d8e1ea";
    ctx.fillText(`${compact ? sharkLabels[summary.kind].slice(0, 5) : sharkLabels[summary.kind]} ${summary.count}`, textX, rowY + 5);
    drawBar(ctx, textX, rowY + 16, barWidth, 6, summary.totalHunger / summary.maxHunger, "#5f7186");
  });
};
