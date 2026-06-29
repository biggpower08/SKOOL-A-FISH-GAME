import type { RunState } from "../game/types";
import { defaultFishCounts } from "./fishTypes";
import { normalizeRun } from "./upgrades";

const SAVE_KEY = "skool-a-fish-game-save";

type StoredRun = {
  version: 1;
  run: RunState;
};

export const saveRun = (run: RunState): void => {
  if (typeof localStorage === "undefined") {
    return;
  }

  const stored: StoredRun = {
    version: 1,
    run,
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(stored));
};

export const loadRun = (): RunState | null => {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredRun;

    if (parsed.version !== 1) {
      return null;
    }

    return normalizeRun({
      ...parsed.run,
      fishCounts: parsed.run.fishCounts ?? {
        ...defaultFishCounts(),
        tilapia: parsed.run.fishCount,
      },
      ownedArtifacts: parsed.run.ownedArtifacts ?? [],
    });
  } catch {
    return null;
  }
};

export const clearRun = (): void => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.removeItem(SAVE_KEY);
};

export const hasSavedRun = (): boolean => loadRun() !== null;
