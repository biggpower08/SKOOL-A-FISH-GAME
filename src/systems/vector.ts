import type { Vector } from "../game/types";

export const add = (a: Vector, b: Vector): Vector => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtract = (a: Vector, b: Vector): Vector => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const scale = (value: Vector, factor: number): Vector => ({
  x: value.x * factor,
  y: value.y * factor,
});

export const length = (value: Vector): number => Math.hypot(value.x, value.y);

export const distance = (a: Vector, b: Vector): number => length(subtract(a, b));

export const normalize = (value: Vector): Vector => {
  const magnitude = length(value);

  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: value.x / magnitude,
    y: value.y / magnitude,
  };
};

export const limit = (value: Vector, max: number): Vector => {
  const magnitude = length(value);

  if (magnitude <= max || magnitude === 0) {
    return value;
  }

  return scale(value, max / magnitude);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const centerOf = (points: Vector[]): Vector => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const total = points.reduce<Vector>(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return scale(total, 1 / points.length);
};
