import type { RunState } from "../game/types";

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
    return parsed.version === 1 ? parsed.run : null;
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
