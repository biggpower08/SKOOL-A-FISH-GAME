import { createSchool } from "../entities/School";
import { createSharks, updateSharks } from "../entities/Shark";
import { drawCombat, drawIdleScene } from "../rendering/renderer";
import { aliveFish, applySchoolPressure, applySharkAttack, drainSharkHunger } from "../systems/combat";
import { updateFlocking } from "../systems/flocking";
import { createLevelConfig } from "../systems/levels";
import { clearRun, hasSavedRun, loadRun, saveRun } from "../systems/save";
import { applyChoice, applyLevelReward, createNewRun } from "../systems/upgrades";
import { clamp } from "../systems/vector";
import { clearOverlay, renderChoice, renderGameOver, renderHome, renderPause, renderSaves } from "../ui/screens";
import type { Bounds, ChoiceId, Fish, GameScreen, LevelConfig, RunState, Shark } from "./types";

const HUD_WIDTH = 188;

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly overlay: HTMLDivElement;
  private readonly artifactButton: HTMLButtonElement;
  private readonly artifactPanel: HTMLDivElement;
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
    this.artifactButton = document.createElement("button");
    this.artifactButton.type = "button";
    this.artifactButton.className = "artifact-edge-button hidden";
    this.artifactButton.textContent = "A";
    this.artifactButton.title = "Artifacts";
    this.artifactButton.addEventListener("click", () => this.toggleArtifactPanel());
    this.artifactPanel = document.createElement("div");
    this.artifactPanel.className = "artifact-panel hidden";
    container.replaceChildren(this.canvas, this.artifactButton, this.artifactPanel, this.overlay);

    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.handleKeyDown);
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

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      if (this.screen === "combat") {
        this.showPause();
        return;
      }

      if (this.screen === "pause") {
        this.resumeCombat();
      }
    }

    if (!this.run) {
      return;
    }

    if (event.key === "]") {
      this.run.currency += 5;
      saveRun(this.run);
    }

    if (event.key === "[") {
      this.run.currency = Math.max(0, this.run.currency - 5);
      saveRun(this.run);
    }
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
    this.hideArtifactPanel();
    renderHome(this.overlay, {
      hasSave: hasSavedRun(),
      onContinue: () => this.continueCampaign(),
      onNewCampaign: () => this.newCampaign(),
      onSaves: () => this.showSaves(),
    });
  }

  private returnHome(): void {
    if (this.run) {
      saveRun(this.run);
    }

    this.showHome();
  }

  private showPause(): void {
    this.screen = "pause";
    this.hideArtifactPanel();
    renderPause(this.overlay, {
      onContinue: () => this.resumeCombat(),
      onHome: () => this.returnHome(),
      onEndRun: () => this.endRun(),
    });
  }

  private resumeCombat(): void {
    if (!this.run) {
      this.showHome();
      return;
    }

    this.screen = "combat";
    clearOverlay(this.overlay);
    this.showArtifactAccess();
  }

  private showSaves(): void {
    this.screen = "saves";
    this.hideArtifactPanel();
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
    this.showArtifactAccess();
    this.config = createLevelConfig(this.run.level);
    this.fish = createSchool(this.run.fishCount, this.run.supportCount, this.combatBounds(), this.run.fishCounts);
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
    const fishCounts = this.fish
      .filter((candidate) => !candidate.caught && candidate.kind !== "support")
      .reduce<RunState["fishCounts"]>((counts, candidate) => {
        counts[candidate.typeId] = (counts[candidate.typeId] ?? 0) + 1;
        return counts;
      }, {});
    this.run = applyLevelReward(
      {
        ...this.run,
        level: this.run.level + 1,
        fishCount: livingBasic,
        supportCount: livingSupport,
        fishCounts,
        schoolEnergy: clamp(this.run.schoolEnergy + 7, 0, 110),
      },
      this.config,
    );
    saveRun(this.run);
    this.screen = "choice";
    this.hideArtifactPanel();
    renderChoice(this.overlay, {
      run: this.run,
      isRecruitment: createLevelConfig(this.run.level).type === "recruit",
      onChoose: (choice) => this.choose(choice),
      onHome: () => this.returnHome(),
      onEndRun: () => this.endRun(),
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
    this.hideArtifactPanel();
    renderGameOver(this.overlay, {
      bestLevel,
      onHome: () => this.showHome(),
      onNewCampaign: () => this.newCampaign(),
    });
  }

  private showArtifactAccess(): void {
    this.artifactButton.classList.remove("hidden");
  }

  private toggleArtifactPanel(): void {
    if (this.screen !== "combat") {
      return;
    }

    const isOpen = !this.artifactPanel.classList.contains("hidden");

    if (isOpen) {
      this.artifactPanel.className = "artifact-panel hidden";
      this.artifactPanel.replaceChildren();
      return;
    }

    const title = document.createElement("h2");
    title.textContent = "Artifacts";
    const empty = document.createElement("p");
    empty.textContent = "No artifacts yet";
    const future = document.createElement("p");
    future.textContent = "Future collection";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", () => this.closeArtifactPanel());
    this.artifactPanel.className = "artifact-panel";
    this.artifactPanel.replaceChildren(title, empty, future, close);
  }

  private closeArtifactPanel(): void {
    this.artifactPanel.className = "artifact-panel hidden";
    this.artifactPanel.replaceChildren();
  }

  private hideArtifactPanel(): void {
    this.artifactButton.classList.add("hidden");
    this.closeArtifactPanel();
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
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}
