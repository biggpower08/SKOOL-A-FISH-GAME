import type { Ripple, Vector } from "../game/types";

export const spawnRipple = (pos: Vector, size: number, strength: number): Ripple => ({
  x: pos.x,
  y: pos.y,
  radius: Math.max(4, size * 0.35),
  maxRadius: Math.max(12, size * 2.35),
  opacity: strength,
  strength,
  age: 0,
  lifetime: 0.85,
  scaleX: 1.35,
  scaleY: 0.62,
});

export const updateRipples = (ripples: Ripple[], dt: number): Ripple[] =>
  ripples
    .map((ripple) => {
      const age = ripple.age + dt;
      const progress = Math.min(1, age / ripple.lifetime);

      return {
        ...ripple,
        age,
        radius: ripple.radius + (ripple.maxRadius - ripple.radius) * progress * 0.34,
        opacity: ripple.strength * (1 - progress),
      };
    })
    .filter((ripple) => ripple.age < ripple.lifetime && ripple.opacity > 0.005);
