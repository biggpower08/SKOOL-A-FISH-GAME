import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRun, hasSavedRun, loadRun, saveRun } from "./save";
import { createNewRun } from "./upgrades";

const installStorage = (): Map<string, string> => {
  const values = new Map<string, string>();

  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  });

  return values;
};

describe("save system", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips a run through localStorage", () => {
    installStorage();
    const run = {
      ...createNewRun(),
      level: 9,
      currency: 14,
    };

    saveRun(run);

    expect(hasSavedRun()).toBe(true);
    expect(loadRun()).toEqual(run);
  });

  it("returns null for missing or invalid saves", () => {
    const values = installStorage();

    expect(loadRun()).toBeNull();

    values.set("skool-a-fish-game-save", "{bad json");

    expect(loadRun()).toBeNull();
  });

  it("clears saved campaigns", () => {
    installStorage();
    saveRun(createNewRun());
    clearRun();

    expect(hasSavedRun()).toBe(false);
  });

  it("converts legacy support fish saves into active fish safely", () => {
    const values = installStorage();
    values.set(
      "skool-a-fish-game-save",
      JSON.stringify({
        version: 1,
        run: {
          ...createNewRun(),
          fishCount: 37,
          supportCount: 1,
          fishCounts: {
            tilapia: 36,
            support: 1,
          },
        },
      }),
    );

    const run = loadRun();

    expect(run?.supportCount).toBe(0);
    expect(run?.fishCounts.support).toBeUndefined();
    expect(run?.fishCounts.salmon).toBe(1);
    expect(run?.maxFishCount).toBe(40);
  });
});
