import { createSchool } from "../entities/School";
import { createSharks, updateSharks } from "../entities/Shark";
import { drawCombat, drawIdleScene } from "../rendering/renderer";
import { aliveFish, applySchoolPressure, applySharkAttack, drainSharkHunger } from "../systems/combat";
import { updateFlocking } from "../systems/flocking";
import { createLevelConfig } from "../systems/levels";
import { clearRun, hasSavedRun, loadRun, saveRun } from "../systems/save";
import { applyChoice, applyLevelReward, createNewRun } from "../systems/upgrades";
import { clamp } from "../systems/vector";
import { clearOverlay, renderChoice, renderGameOver, renderHome, renderSaves } from "../ui/screens";
import type { Bounds, ChoiceId, Fish, GameScreen, LevelConfig, RunState, Shark } from "./types";

const HUD_WIDTH = 188;

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly overlay: HTMLDivElement;
  private screen: GameScreen = "home";
  private run: RunState | null = null;
  private config: LevelConfig = createLevelConfig(1);
  private fish: Fish[] = [];
  private sharks: Shark[] = [];
  private width = 960;
  private height = 540;
  private lastTime = 0;
  private elapsed = 0;
  private victoryFeedback = 0;
  private animationId = 0;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "game-canvas";

    const context = this.canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available.");
    }

    this.ctx = context;
    this.overlay = document.createElement("div");
    this.overlay.className = "overlay";
    container.replaceChildren(this.canvas, this.overlay);

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  start(): void {
    this.showHome();
    this.animationId = window.requestAnimationFrame(this.loop);
  }

  private readonly resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    this.width = Math.max(720, window.innerWidth);
    this.height = Math.max(420, window.innerHeight);
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private readonly loop = (time: number): void => {
    const dt = this.lastTime === 0 ? 0 : Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (this.screen === "combat") {
      this.updateCombat(dt);
    }

    this.render(time);
    this.animationId = window.requestAnimationFrame(this.loop);
  };

  private combatBounds(): Bounds {
    return {
      width: Math.max(360, this.width - HUD_WIDTH),
      height: this.height,
    };
  }

  private showHome(): void {
    this.screen = "home";
    renderHome(this.overlay, {
      hasSave: hasSavedRun(),
      onContinue: () => this.continueCampaign(),
      onNewCampaign: () => this.newCampaign(),
      onSaves: () => this.showSaves(),
    });
  }

  private showSaves(): void {
    this.screen = "saves";
    renderSaves(this.overlay, {
      run: loadRun(),
      onBack: () => this.showHome(),
    });
  }

  private newCampaign(): void {
    this.run = createNewRun();
    saveRun(this.run);
    this.startLevel();
  }

  private continueCampaign(): void {
    this.run = loadRun() ?? createNewRun();
    this.startLevel();
  }

  private startLevel(): void {
    if (!this.run) {
      return;
    }

    this.screen = "combat";
    clearOverlay(this.overlay);
    this.config = createLevelConfig(this.run.level);
    this.fish = createSchool(this.run.fishCount, this.run.supportCount, this.combatBounds());
    this.sharks = createSharks(this.config, this.combatBounds());
    this.elapsed = 0;
    this.victoryFeedback = 0;
    saveRun(this.run);
  }

  private updateCombat(dt: number): void {
    if (!this.run) {
      return;
    }

    const step = Math.max(0.25, dt * 60);
    const bounds = this.combatBounds();
    this.elapsed += dt;

    if (this.victoryFeedback > 0) {
      this.victoryFeedback -= dt;

      if (this.victoryFeedback <= 0) {
        this.completeLevel();
      }

      return;
    }

    updateFlocking(this.fish, this.sharks, {
      ...bounds,
      threatRadius: this.config.fishThreatRadius,
      dt: step,
    });
    updateSharks(this.sharks, this.fish, bounds, step);

    for (const shark of this.sharks) {
      if (shark.health <= 0 || shark.starved) {
        continue;
      }

      shark.attackCooldown -= dt;

      if (shark.attackCooldown <= 0) {
        const result = applySharkAttack(this.fish, shark, this.config);
        this.run.schoolEnergy -= result.caught * (2.4 + this.config.level * 0.035) + result.damagedSupport * 0.8;
        shark.attackCooldown = shark.attackRate;
      }
    }

    applySchoolPressure(this.fish, this.sharks, dt);
    drainSharkHunger(this.sharks, dt);

    const supportCount = this.fish.filter((candidate) => candidate.kind === "support" && !candidate.caught).length;
    const activeSharks = this.sharks.filter((shark) => shark.health > 0 && !shark.starved).length;
    this.run.schoolEnergy = clamp(
      this.run.schoolEnergy + supportCount * dt * 0.55 - activeSharks * dt * (0.08 + this.config.level * 0.003),
      0,
      110,
    );

    if (aliveFish(this.fish).length === 0 || this.run.schoolEnergy <= 0) {
      this.endRun();
      return;
    }

    const starved = this.sharks.every((shark) => shark.starved || shark.health <= 0);
    const expired = this.elapsed >= this.levelDuration();

    if (starved || expired) {
      for (const shark of this.sharks) {
        shark.starved = true;
        shark.hunger = 0;
        shark.vel = { x: 0, y: 0 };
      }

      this.victoryFeedback = 1.2;
    }
  }

  private levelDuration(): number {
    return 31 + Math.min(18, this.config.level * 0.22);
  }

  private completeLevel(): void {
    if (!this.run) {
      return;
    }

    const livingBasic = this.fish.filter((candidate) => candidate.kind === "basic" && !candidate.caught).length;
    const livingSupport = this.fish.filter((candidate) => candidate.kind === "support" && !candidate.caught).length;
    this.run = applyLevelReward(
      {
        ...this.run,
        level: this.run.level + 1,
        fishCount: livingBasic,
        supportCount: livingSupport,
        schoolEnergy: clamp(this.run.schoolEnergy + 7, 0, 110),
      },
      this.config,
    );
    saveRun(this.run);
    this.screen = "choice";
    renderChoice(this.overlay, {
      run: this.run,
      onChoose: (choice) => this.choose(choice),
    });
  }

  private choose(choice: ChoiceId): void {
    if (!this.run) {
      return;
    }

    this.run = applyChoice(this.run, choice);
    saveRun(this.run);
    this.startLevel();
  }

  private endRun(): void {
    const bestLevel = Math.max(this.run?.bestLevel ?? 1, this.config.level);
    clearRun();
    this.screen = "gameover";
    renderGameOver(this.overlay, {
      bestLevel,
      onHome: () => this.showHome(),
      onNewCampaign: () => this.newCampaign(),
    });
  }

  private render(time: number): void {
    this.ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);

    if (this.screen === "combat" && this.run) {
      drawCombat(this.ctx, this.width, this.height, this.run, this.config, this.fish, this.sharks, time);
      return;
    }

    drawIdleScene(this.ctx, this.width, this.height, time);
  }

  destroy(): void {
    window.cancelAnimationFrame(this.animationId);
    window.removeEventListener("resize", this.resize);
  }
}
