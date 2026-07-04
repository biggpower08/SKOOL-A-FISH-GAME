import { describe, expect, it } from "vitest";
import { createNewRun } from "../systems/upgrades";
import { gameOverSummaryText, saveSummaryText } from "./screens";

describe("progression summaries", () => {
  it("summarizes save progress with level, school, and Shells", () => {
    expect(saveSummaryText({ ...createNewRun(), level: 12, fishCount: 41, maxFishCount: 62, currency: 180 })).toEqual([
      "Level 12",
      "Best 1",
      "School 41/62",
      "Shells 180",
    ]);
  });

  it("summarizes run end progress without needing a saved run", () => {
    expect(gameOverSummaryText({ bestLevel: 9, finalFish: 3, maxFish: 54 })).toEqual([
      "Reached L9",
      "School 3/54",
    ]);
  });
});
