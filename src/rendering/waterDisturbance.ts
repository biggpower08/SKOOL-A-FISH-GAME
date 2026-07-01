const DEFAULT_CELL_SIZE = 18;
const DAMPING = 0.955;
const SETTLE_THRESHOLD = 0.0028;
const MAX_DT = 1 / 24;

export class WaterDisturbanceField {
  private width = 1;
  private height = 1;
  private columns = 1;
  private rows = 1;
  private current = new Float32Array(1);
  private previous = new Float32Array(1);
  private active = false;
  private lastEnergy = 0;

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
  }

  touch(x: number, y: number, radius: number, strength: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0 || strength <= 0) {
      return;
    }

    const centerX = this.toColumn(x);
    const centerY = this.toRow(y);
    const radiusCells = Math.max(1, Math.ceil(radius / this.cellSize));
    const minX = Math.max(1, centerX - radiusCells);
    const maxX = Math.min(this.columns - 2, centerX + radiusCells);
    const minY = Math.max(1, centerY - radiusCells);
    const maxY = Math.min(this.rows - 2, centerY + radiusCells);
    const pressure = Math.min(1.4, strength);

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
  }

  update(dt: number): void {
    if (!this.active) {
      return;
    }

    const step = Math.min(MAX_DT, Math.max(0, dt));

    if (step === 0) {
      return;
    }

    let energy = 0;
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
    this.lastEnergy = energy;

    if (energy < SETTLE_THRESHOLD) {
      this.current.fill(0);
      this.previous.fill(0);
      this.active = false;
      this.lastEnergy = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 1;

    for (let row = 1; row < this.rows - 1; row += 1) {
      for (let column = 1; column < this.columns - 1; column += 1) {
        const value = this.current[this.index(column, row)];
        const magnitude = Math.abs(value);

        if (magnitude < 0.018) {
          continue;
        }

        const alpha = Math.min(0.16, magnitude * 0.12);
        const x = column * this.cellSize;
        const y = row * this.cellSize;
        const lift = Math.max(2, Math.min(8, magnitude * 8));

        ctx.strokeStyle = value > 0 ? `rgba(128, 196, 230, ${alpha})` : `rgba(210, 232, 244, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(x - this.cellSize * 0.34, y + lift * 0.18);
        ctx.quadraticCurveTo(x, y - lift, x + this.cellSize * 0.34, y + lift * 0.18);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  isActive(): boolean {
    return this.active;
  }

  energy(): number {
    return this.lastEnergy;
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
