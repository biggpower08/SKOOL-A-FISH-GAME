import type { Ripple, Vector } from "../game/types";

export const spawnRipple = (pos: Vector, size: number, strength: number): Ripple => ({
  x: pos.x,
  y: pos.y,
  radius: Math.max(4, size * 0.35),
  maxRadius: Math.max(12, size * (strength > 0.18 ? 2.75 : 2.15)),
  opacity: strength,
  strength,
  age: 0,
  lifetime: strength > 0.18 ? 1.05 : 0.78,
  scaleX: strength > 0.18 ? 1.55 : 1.28,
  scaleY: strength > 0.18 ? 0.54 : 0.66,
  driftX: Math.sin(pos.y * 0.017) * strength * 10,
  driftY: Math.cos(pos.x * 0.013) * strength * 4,
});

export const updateRipples = (ripples: Ripple[], dt: number): Ripple[] =>
  ripples
    .map((ripple) => {
      const age = ripple.age + dt;
      const progress = Math.min(1, age / ripple.lifetime);

      return {
        ...ripple,
        age,
        x: ripple.x + ripple.driftX * dt,
        y: ripple.y + ripple.driftY * dt,
        radius: ripple.radius + (ripple.maxRadius - ripple.radius) * progress * 0.34,
        opacity: ripple.strength * (1 - progress),
      };
    })
    .filter((ripple) => ripple.age < ripple.lifetime && ripple.opacity > 0.005);
