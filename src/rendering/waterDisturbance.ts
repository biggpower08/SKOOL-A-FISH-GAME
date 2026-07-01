import type { Vector } from "../game/types";

const DEFAULT_CELL_SIZE = 18;
const DAMPING = 0.955;
const SETTLE_THRESHOLD = 0.0028;
const MAX_DT = 1 / 24;
const WAKE_LIFETIME = 1.1;

type DirectionalWake = {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  radius: number;
  strength: number;
  age: number;
  lifetime: number;
};

export class WaterDisturbanceField {
  private width = 1;
  private height = 1;
  private columns = 1;
  private rows = 1;
  private current = new Float32Array(1);
  private previous = new Float32Array(1);
  private active = false;
  private lastEnergy = 0;
  private wakes: DirectionalWake[] = [];

  constructor(width: number, height: number, private readonly cellSize = DEFAULT_CELL_SIZE) {
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.columns = Math.max(3, Math.ceil(this.width / this.cellSize));
    this.rows = Math.max(3, Math.ceil(this.height / this.cellSize));
    this.current = new Float32Array(this.columns * this.rows);
    this.previous = new Float32Array(this.columns * this.rows);
    this.active = false;
    this.lastEnergy = 0;
    this.wakes = [];
  }

  touch(x: number, y: number, radius: number, strength: number, velocity?: Vector): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0 || strength <= 0) {
      return;
    }

    const speed = velocity && Number.isFinite(velocity.x) && Number.isFinite(velocity.y) ? Math.hypot(velocity.x, velocity.y) : 0;
    const centerX = this.toColumn(x);
    const centerY = this.toRow(y);
    const radiusCells = Math.max(1, Math.ceil(radius / this.cellSize));
    const minX = Math.max(1, centerX - radiusCells);
    const maxX = Math.min(this.columns - 2, centerX + radiusCells);
    const minY = Math.max(1, centerY - radiusCells);
    const maxY = Math.min(this.rows - 2, centerY + radiusCells);
    const pressure = Math.min(1.6, strength + Math.min(0.3, speed * 0.035));

    for (let row = minY; row <= maxY; row += 1) {
      for (let column = minX; column <= maxX; column += 1) {
        const dx = column - centerX;
        const dy = row - centerY;
        const distance = Math.hypot(dx, dy);

        if (distance > radiusCells) {
          continue;
        }

        const falloff = 1 - distance / (radiusCells + 0.001);
        this.current[this.index(column, row)] += pressure * falloff * falloff;
      }
    }

    this.active = true;
    this.lastEnergy = Math.max(this.lastEnergy, pressure);

    if (speed > 0.15) {
      this.wakes.push({
        x: Math.max(0, Math.min(this.width, x)),
        y: Math.max(0, Math.min(this.height, y)),
        dirX: velocity!.x / speed,
        dirY: velocity!.y / speed,
        radius: Math.max(4, radius),
        strength: Math.min(1.5, pressure),
        age: 0,
        lifetime: WAKE_LIFETIME,
      });

      if (this.wakes.length > 90) {
        this.wakes = this.wakes.slice(-90);
      }
    }
  }

  update(dt: number): void {
    if (!this.active && this.wakes.length === 0) {
      return;
    }

    const step = Math.min(MAX_DT, Math.max(0, dt));

    if (step === 0) {
      return;
    }

    let energy = 0;

    if (this.active) {
      const next = this.previous;

      for (let row = 1; row < this.rows - 1; row += 1) {
        for (let column = 1; column < this.columns - 1; column += 1) {
          const index = this.index(column, row);
          const value =
            ((this.current[index - 1] + this.current[index + 1] + this.current[index - this.columns] + this.current[index + this.columns]) / 2 -
              next[index]) *
            DAMPING;

          next[index] = value;
          energy = Math.max(energy, Math.abs(value));
        }
      }

      this.previous = this.current;
      this.current = next;

      if (energy < SETTLE_THRESHOLD) {
        this.current.fill(0);
        this.previous.fill(0);
        this.active = false;
      }
    }

    this.wakes = this.wakes
      .map((wake) => ({ ...wake, age: wake.age + step }))
      .filter((wake) => wake.age < wake.lifetime);

    const wakeEnergy = this.wakes.reduce((sum, wake) => Math.max(sum, wake.strength * (1 - wake.age / wake.lifetime)), 0);
    this.lastEnergy = Math.max(this.active ? energy : 0, wakeEnergy);

    if (!this.active && this.wakes.length === 0) {
      this.lastEnergy = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active && this.wakes.length === 0) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 1;

    if (this.active) {
      for (let row = 1; row < this.rows - 1; row += 1) {
        for (let column = 1; column < this.columns - 1; column += 1) {
          const value = this.current[this.index(column, row)];
          const magnitude = Math.abs(value);

          if (magnitude < 0.018) {
            continue;
          }

          const alpha = Math.min(0.2, magnitude * 0.14);
          const x = column * this.cellSize;
          const y = row * this.cellSize;
          const lift = Math.max(2, Math.min(9, magnitude * 9));

          ctx.strokeStyle = value > 0 ? `rgba(128, 210, 230, ${alpha})` : `rgba(222, 244, 238, ${alpha * 0.78})`;
          ctx.beginPath();
          ctx.moveTo(x - this.cellSize * 0.42, y + lift * 0.2);
          ctx.quadraticCurveTo(x, y - lift, x + this.cellSize * 0.42, y + lift * 0.2);
          ctx.stroke();
        }
      }
    }

    this.drawWakes(ctx);
    ctx.restore();
  }

  isActive(): boolean {
    return this.active || this.wakes.length > 0;
  }

  energy(): number {
    return this.lastEnergy;
  }

  wakeCount(): number {
    return this.wakes.length;
  }

  sampleCurrent(x: number, y: number, time = 0): Vector {
    const safeX = Number.isFinite(x) ? Math.max(0, Math.min(this.width, x)) : this.width / 2;
    const safeY = Number.isFinite(y) ? Math.max(0, Math.min(this.height, y)) : this.height / 2;
    const depth = safeY / Math.max(1, this.height);
    const lane = Math.sin(safeY * 0.019 + time * 0.72) * 0.026;
    const curl = Math.cos(safeX * 0.014 - time * 0.46) * 0.016;
    const undertow = Math.sin((safeX / Math.max(1, this.width)) * Math.PI * 2 + time * 0.28) * 0.014;

    return {
      x: 0.032 + lane + undertow * (0.4 + depth * 0.6),
      y: curl * (0.45 + depth * 0.55),
    };
  }

  private drawWakes(ctx: CanvasRenderingContext2D): void {
    for (const wake of this.wakes) {
      const progress = wake.age / wake.lifetime;
      const alpha = Math.max(0, (1 - progress) * 0.22 * wake.strength);
      const normalX = -wake.dirY;
      const normalY = wake.dirX;
      const tail = wake.radius * (0.75 + progress * 1.4);
      const spread = wake.radius * (0.38 + progress * 0.68);
      const originX = wake.x - wake.dirX * wake.radius * 0.16;
      const originY = wake.y - wake.dirY * wake.radius * 0.16;
      const tailX = wake.x - wake.dirX * tail;
      const tailY = wake.y - wake.dirY * tail;

      ctx.lineWidth = Math.max(1, wake.radius * 0.035);
      ctx.strokeStyle = `rgba(174, 231, 236, ${alpha})`;

      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(originX + normalX * side * wake.radius * 0.12, originY + normalY * side * wake.radius * 0.12);
        ctx.quadraticCurveTo(
          wake.x - wake.dirX * tail * 0.52 + normalX * side * spread * 0.38,
          wake.y - wake.dirY * tail * 0.52 + normalY * side * spread * 0.38,
          tailX + normalX * side * spread,
          tailY + normalY * side * spread,
        );
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(225, 246, 238, ${alpha * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
  }

  private toColumn(x: number): number {
    return Math.max(1, Math.min(this.columns - 2, Math.round(x / this.cellSize)));
  }

  private toRow(y: number): number {
    return Math.max(1, Math.min(this.rows - 2, Math.round(y / this.cellSize)));
  }

  private index(column: number, row: number): number {
    return row * this.columns + column;
  }
}
