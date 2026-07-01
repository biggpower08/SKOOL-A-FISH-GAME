import { describe, expect, it } from "vitest";
import { WaterDisturbanceField } from "./waterDisturbance";

describe("WaterDisturbanceField", () => {
  it("accepts touch drops, updates with damping, and eventually settles", () => {
    const field = new WaterDisturbanceField(160, 100, 20);

    field.touch(80, 50, 24, 0.8);

    expect(field.isActive()).toBe(true);
    expect(field.energy()).toBeGreaterThan(0);

    const initialEnergy = field.energy();
    field.update(1 / 30);

    expect(field.energy()).toBeGreaterThan(0);
    expect(field.energy()).not.toBe(initialEnergy);

    for (let index = 0; index < 220; index += 1) {
      field.update(1 / 30);
    }

    expect(field.isActive()).toBe(false);
  });

  it("resizes and clamps touches to the field bounds", () => {
    const field = new WaterDisturbanceField(100, 80, 20);

    field.resize(260, 140);
    field.touch(999, -30, 40, 1);

    expect(field.isActive()).toBe(true);
    expect(field.energy()).toBeGreaterThan(0);
  });
});
