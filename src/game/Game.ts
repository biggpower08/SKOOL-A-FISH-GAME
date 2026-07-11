import { createSchool } from "../entities/School";
import { createSharks, isActiveShark, isDefeatedShark, updateSharks } from "../entities/Shark";
import { drawCombat, drawIdleScene } from "../rendering/renderer";
import { fishWakeFor } from "../rendering/fishMotion";
import { getSharkSprite, spriteRippleSize } from "../rendering/sprites";
import { WaterDisturbanceField } from "../rendering/waterDisturbance";
import { applyContactSharkBite, applySchoolPressure, applySharkAttack, drainSharkHunger, hasLivingSchoolFish, summarizeAliveFishCounts } from "../systems/combat";
import { getSchoolModifiers } from "../systems/artifactEffects";
import { updateFlocking } from "../systems/flocking";
import { createLevelConfig } from "../systems/levels";
import { clearRun, hasSavedRun, loadRun, saveRun } from "../systems/save";
import { artifactDefinitions, isArtifactId } from "../systems/artifacts";
import { uiIconAssets } from "../rendering/assetPaths";
import { advanceKelpFeeding, fadeConsumedKelp, isFeedableKelpGoal, kelpGoalPosition, schoolRoamDestination, type KelpGoal } from "../systems/startPositions";
import {
  DEV_FREE_PURCHASES,
  applyArtifactExhaustionFallback,
  applyArtifactReward,
  applyChoice,
  applyLevelReward,
  applyRoundRecovery,
  createNewRun,
  hasArtifactChoicesRemaining,
  lostFishCountsAfterRound,
  rewardFlowForCompletedLevel,
} from "../systems/upgrades";
import { clamp } from "../systems/vector";
import { clearOverlay, renderChoice, renderGameOver, renderHome, renderPause, renderSaves, renderSettings } from "../ui/screens";
import { hudWidth } from "../ui/hud";
import type { Bounds, Fish, FishTypeId, GameMode, GameScreen, LevelConfig, RewardChoiceId, RunState, Shark } from "./types";

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly overlay: HTMLDivElement;
  private readonly artifactButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly artifactPanel: HTMLDivElement;
  private readonly devLevelScroller: HTMLDivElement;
  private screen: GameScreen = "home";
  private run: RunState | null = null;
  private mode: GameMode = "player";
  private config: LevelConfig = createLevelConfig(1);
  private fish: Fish[] = [];
  private sharks: Shark[] = [];
  private levelStartFishCounts: Partial<Record<FishTypeId, number>> = {};
  private waterDisturbance = new WaterDisturbanceField(960, 540);
  private width = 960;
  private height = 540;
  private lastTime = 0;
  private elapsed = 0;
  private victoryFeedback = 0;
  private animationId = 0;
  private devLevelOffset = 1;
  private fishRippleClock = 0;
  private schoolDestination = { x: 420, y: 270 };
  private schoolDestinationUntil = 0;
  private kelpGoal: KelpGoal | null = null;
  private kelpGoalUntil = 0;
  private kelpRespawnAt = 0;

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
    this.artifactButton.title = "Artifacts";
    const artifactAccessIcon = document.createElement("img");
    artifactAccessIcon.src = uiIconAssets.treasureChest;
    artifactAccessIcon.alt = "Artifacts";
    this.artifactButton.replaceChildren(artifactAccessIcon);
    this.artifactButton.addEventListener("click", () => this.toggleArtifactPanel());
    this.pauseButton = document.createElement("button");
    this.pauseButton.type = "button";
    this.pauseButton.className = "pause-edge-button hidden";
    this.pauseButton.title = "Pause";
    this.pauseButton.textContent = "II";
    this.pauseButton.addEventListener("click", () => {
      if (this.screen === "combat") {
        this.showPause();
      }
    });
    this.artifactPanel = document.createElement("div");
    this.artifactPanel.className = "artifact-panel hidden";
    this.devLevelScroller = document.createElement("div");
    this.devLevelScroller.className = "dev-level-scroller";
    this.devLevelScroller.addEventListener("wheel", this.handleLevelScrollerWheel, { passive: false });
    container.replaceChildren(this.canvas, this.devLevelScroller, this.artifactButton, this.pauseButton, this.artifactPanel, this.overlay);

    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.handleKeyDown);
    this.canvas.addEventListener("pointerdown", this.handleCanvasPointer);
    this.canvas.addEventListener("pointermove", this.handleCanvasPointer);
    this.resize();
  }

  start(): void {
    this.showHome();
    this.animationId = window.requestAnimationFrame(this.loop);
  }

  private readonly resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    this.width = Math.max(320, window.innerWidth);
    this.height = Math.max(320, window.innerHeight);
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.waterDisturbance.resize(this.width - hudWidth(this.width), this.height);
  };

  private readonly handleCanvasPointer = (event: PointerEvent): void => {
    if (this.screen !== "combat" || !this.run) {
      return;
    }

    if (event.type === "pointermove" && event.pointerType !== "touch" && event.buttons !== 1) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const bounds = this.combatBounds();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * this.width;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * this.height;

    if (x > bounds.width) {
      return;
    }

    event.preventDefault();
    this.schoolDestination = {
      x: clamp(x, 24, bounds.width - 24),
      y: clamp(y, 24, bounds.height - 24),
    };
    this.schoolDestinationUntil = this.elapsed + 4.5;
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

    if (this.mode !== "dev") {
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

  private readonly handleLevelScrollerWheel = (event: WheelEvent): void => {
    if (this.mode !== "dev") {
      return;
    }

    event.preventDefault();
    const delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (delta === 0) {
      return;
    }

    this.devLevelOffset = clamp(this.devLevelOffset + Math.sign(delta), 1, 66);
    this.renderDevLevelScroller();
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
      width: Math.max(220, this.width - hudWidth(this.width)),
      height: this.height,
    };
  }

  private showHome(): void {
    this.screen = "home";
    this.hideArtifactPanel();
    this.hideDevLevelScroller();
    renderHome(this.overlay, {
      hasSave: hasSavedRun(),
      onPlay: () => this.newCampaign("player"),
      onContinue: () => this.continueCampaign("player"),
      onSaves: () => this.showSaves(),
      onSettings: () => this.showSettings(),
    });
  }

  private showSettings(): void {
    this.screen = "settings";
    this.hideArtifactPanel();
    this.hideDevLevelScroller();
    renderSettings(this.overlay, {
      onDevMode: () => this.newCampaign("dev"),
      onBack: () => this.showHome(),
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
    this.pauseButton.classList.add("hidden");
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
    this.pauseButton.classList.remove("hidden");
  }

  private showSaves(): void {
    this.screen = "saves";
    this.hideArtifactPanel();
    this.hideDevLevelScroller();
    renderSaves(this.overlay, {
      run: loadRun(),
      onBack: () => this.showHome(),
    });
  }

  private newCampaign(mode: GameMode): void {
    this.mode = mode;
    this.run = createNewRun();
    saveRun(this.run);
    this.startLevel();
  }

  private continueCampaign(mode: GameMode): void {
    this.mode = mode;
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
    this.run.lastInvestmentReturn = 0;
    this.levelStartFishCounts = { ...this.run.fishCounts };
    const bounds = this.combatBounds();
    const modifiers = getSchoolModifiers(this.run);
    this.fish = createSchool(this.run.fishCount, this.run.supportCount, bounds, this.run.fishCounts, modifiers, this.config.level);
    this.sharks = createSharks(this.config, bounds, modifiers);
    this.schoolDestination = schoolRoamDestination(
      bounds,
      this.config.level,
      this.currentSchoolCenter(bounds),
      this.sharks.map((shark) => shark.pos),
    );
    this.schoolDestinationUntil = 3.4;
    this.refreshKelpGoal(bounds, this.config.level);
    this.waterDisturbance.resize(bounds.width, bounds.height);
    this.fishRippleClock = 0;
    this.elapsed = 0;
    this.victoryFeedback = 0;
    saveRun(this.run);
    this.devLevelOffset = clamp(Math.min(this.run.level, this.devLevelOffset), 1, 66);
    this.renderDevLevelScroller();
  }

  private jumpToLevel(level: number): void {
    if (this.mode !== "dev") {
      return;
    }

    this.run = {
      ...(this.run ?? createNewRun()),
      level,
      bestLevel: Math.max(this.run?.bestLevel ?? 1, level),
      schoolEnergy: Math.max(this.run?.schoolEnergy ?? 100, 35),
    };
    saveRun(this.run);
    this.hideArtifactPanel();
    this.startLevel();
  }

  private renderDevLevelScroller(): void {
    if (this.mode !== "dev" || this.screen === "home" || this.screen === "settings" || this.screen === "saves") {
      this.hideDevLevelScroller();
      return;
    }

    this.devLevelScroller.classList.remove("hidden");
    const label = document.createElement("span");
    label.textContent = "DEV";
    const buttons: HTMLButtonElement[] = [];
    const currentLevel = this.run?.level ?? 1;
    const start = clamp(this.devLevelOffset, 1, 66);

    for (let level = start; level < start + 5; level += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${level}`;
      button.title = `Jump to level ${level}`;
      button.className = level === currentLevel ? "active" : "";
      button.addEventListener("click", () => this.jumpToLevel(level));
      buttons.push(button);
    }

    const recruitButton = document.createElement("button");
    recruitButton.type = "button";
    recruitButton.textContent = "R";
    recruitButton.title = "Open recruit test";
    recruitButton.addEventListener("click", () => this.openRecruitTest());

    this.devLevelScroller.replaceChildren(label, ...buttons, recruitButton);
  }

  private openRecruitTest(): void {
    if (this.mode !== "dev") {
      return;
    }

    this.run ??= createNewRun();
    saveRun(this.run);
    this.hideArtifactPanel();
    this.showIntermission("recruit");
  }

  private updateCombat(dt: number): void {
    if (!this.run) {
      return;
    }

    const step = Math.max(0.25, dt * 60);
    const bounds = this.combatBounds();
    const modifiers = getSchoolModifiers(this.run);
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
      schoolIntent: this.schoolIntent(),
      kelpGoal: this.feedableKelpGoal(),
      currentAt: (position) => this.waterDisturbance.sampleCurrent(position.x, position.y, this.elapsed),
    });
    updateSharks(this.sharks, this.fish, bounds, step, dt);
    this.updateCaughtFish(dt);
    this.updateKelpLifecycle(dt, bounds);
    this.updateWaterDisturbance(dt);

    for (const shark of this.sharks) {
      if (shark.health <= 0 || shark.starved) {
        continue;
      }

      const contactResult = applyContactSharkBite(this.fish, shark, this.config, modifiers);
      this.run.schoolEnergy -= contactResult.caught * (2.4 + this.config.level * 0.035) + contactResult.damagedSupport * 0.8;

      if (contactResult.caught > 0) {
        const sprite = getSharkSprite(shark.kind);
        const size = sprite ? spriteRippleSize(sprite, shark.radius) : shark.radius * 1.35;
        this.waterDisturbance.touch(shark.pos.x, shark.pos.y, size * 0.34, 0.95, shark.vel);
      }

      shark.attackCooldown -= dt;

      if (shark.attackCooldown <= 0) {
        const result = applySharkAttack(this.fish, shark, this.config, Math.random, modifiers);
        this.run.schoolEnergy -= result.caught * (2.4 + this.config.level * 0.035) + result.damagedSupport * 0.8;

        if (result.caught > 0) {
          const sprite = getSharkSprite(shark.kind);
          const size = sprite ? spriteRippleSize(sprite, shark.radius) : shark.radius * 1.35;
          this.waterDisturbance.touch(shark.pos.x, shark.pos.y, size * 0.38, 1.05, shark.vel);
        }

        shark.attackCooldown = shark.attackRate;
      }
    }

    this.syncRunFishCountsFromSchool();

    applySchoolPressure(this.fish, this.sharks, dt);
    drainSharkHunger(this.sharks, dt * modifiers.sharkHungerDrainMultiplier);

    const supportCount = this.fish.filter((candidate) => candidate.kind === "support" && !candidate.caught).length;
    const activeSharks = this.sharks.filter(isActiveShark).length;
    this.run.schoolEnergy = clamp(
      this.run.schoolEnergy + supportCount * dt * 0.55 - activeSharks * dt * (0.08 + this.config.level * 0.003),
      0,
      110,
    );

    if (!hasLivingSchoolFish(this.fish)) {
      this.endRun();
      return;
    }

    const starved = this.sharks.every(isDefeatedShark);
    const expired = this.elapsed >= this.levelDuration();

    if (starved || expired) {
      for (const shark of this.sharks) {
        if (shark.health <= 0) {
          continue;
        }

        shark.starved = true;
        shark.hunger = 0;
        shark.vel = { x: 0, y: 0 };
      }

      this.victoryFeedback = 1.2;
    }
  }

  private updateCaughtFish(dt: number): void {
    for (const fish of this.fish) {
      if (!fish.caught || fish.caughtTimer === undefined) {
        continue;
      }

      fish.caughtTimer -= dt;
    }

    this.fish = this.fish.filter((fish) => !fish.caught || (fish.caughtTimer ?? 0) > 0);
  }

  private updateKelpLifecycle(dt: number, bounds = this.combatBounds()): void {
    if (!this.kelpGoal) {
      this.refreshKelpGoal(bounds);
      return;
    }

    if (isFeedableKelpGoal(this.kelpGoal)) {
      const fishOverlapping = this.fish.filter(
        (fish) => !fish.caught && Math.hypot(fish.pos.x - this.kelpGoal!.pos.x, fish.pos.y - this.kelpGoal!.pos.y) <= this.kelpGoal!.radius * 1.35,
      ).length;
      this.kelpGoal = advanceKelpFeeding(this.kelpGoal, fishOverlapping, dt);

      if (this.kelpGoal.state === "consumed") {
        this.kelpRespawnAt = this.elapsed + 2.4;
      }

      return;
    }

    if (this.kelpGoal.state === "consumed") {
      const faded = fadeConsumedKelp(this.kelpGoal, dt);
      this.kelpGoal = faded;

      if (faded.state === "respawning") {
        this.kelpRespawnAt = Math.max(this.kelpRespawnAt, this.elapsed + 1.2);
      }

      return;
    }

    if (this.kelpGoal.state === "respawning" && this.elapsed >= this.kelpRespawnAt) {
      this.refreshKelpGoal(bounds, Math.floor(this.elapsed * 17) + this.config.level * 13);
    }
  }

  private currentSchoolCenter(bounds = this.combatBounds()): { x: number; y: number } {
    const living = this.fish.filter((fish) => !fish.caught);

    if (living.length === 0) {
      return { x: bounds.width / 2, y: bounds.height / 2 };
    }

    return {
      x: living.reduce((sum, fish) => sum + fish.pos.x, 0) / living.length,
      y: living.reduce((sum, fish) => sum + fish.pos.y, 0) / living.length,
    };
  }

  private refreshKelpGoal(bounds = this.combatBounds(), seed = Math.floor(this.elapsed * 11) + this.config.level): void {
    this.kelpGoal = kelpGoalPosition(
      bounds,
      seed,
      this.currentSchoolCenter(bounds),
      this.sharks.filter(isActiveShark).map((shark) => shark.pos),
    );
    this.kelpGoalUntil = this.elapsed + 8.5;
    this.kelpRespawnAt = 0;
  }

  private feedableKelpGoal(): KelpGoal | null {
    return isFeedableKelpGoal(this.kelpGoal) ? this.kelpGoal : null;
  }

  private schoolIntent(): { x: number; y: number } {
    const bounds = this.combatBounds();
    const center = this.currentSchoolCenter(bounds);
    const activeSharkPositions = this.sharks.filter(isActiveShark).map((shark) => shark.pos);
    const closeShark = activeSharkPositions.some((shark) => Math.hypot(shark.x - center.x, shark.y - center.y) < 150);

    const feedableKelp = this.feedableKelpGoal();

    if (!this.kelpGoal || (feedableKelp && this.elapsed >= this.kelpGoalUntil && feedableKelp.progress < 0.03)) {
      this.refreshKelpGoal(bounds);
    }

    if (feedableKelp && !closeShark) {
      return {
        x: feedableKelp.pos.x - center.x,
        y: feedableKelp.pos.y - center.y,
      };
    }

    const distanceToDestination = Math.hypot(this.schoolDestination.x - center.x, this.schoolDestination.y - center.y);

    if (distanceToDestination < 78 || this.elapsed >= this.schoolDestinationUntil) {
      this.schoolDestination = schoolRoamDestination(
        bounds,
        this.config.level * 19 + Math.floor(this.elapsed * 1.7),
        center,
        activeSharkPositions,
      );
      this.schoolDestinationUntil = this.elapsed + 3.6;
    }

    return {
      x: this.schoolDestination.x - center.x,
      y: this.schoolDestination.y - center.y,
    };
  }

  private updateWaterDisturbance(dt: number): void {
    this.fishRippleClock -= dt;

    for (const shark of this.sharks) {
      if (!isActiveShark(shark) || Math.hypot(shark.vel.x, shark.vel.y) < 0.45) {
        continue;
      }

      const sprite = getSharkSprite(shark.kind);
      const size = sprite ? spriteRippleSize(sprite, shark.radius) : shark.radius * 1.2;
      this.waterDisturbance.touch(shark.pos.x, shark.pos.y, size * 0.25, 0.2 * dt * 60, shark.vel);
    }

    if (this.fishRippleClock <= 0.08) {
      const activeFish = this.fish.filter((candidate) => fishWakeFor(candidate) !== null);

      for (let index = 0; index < activeFish.length; index += 9) {
        const fish = activeFish[index];
        const wake = fishWakeFor(fish);

        if (!wake) {
          continue;
        }

        this.waterDisturbance.touch(fish.pos.x, fish.pos.y, wake.radius, fish.threatened ? wake.strength * 1.35 : wake.strength, wake.velocity);
      }

      this.fishRippleClock = 0.34;
    }

    this.waterDisturbance.update(dt);
  }

  private syncRunFishCountsFromSchool(): void {
    if (!this.run) {
      return;
    }

    const summary = summarizeAliveFishCounts(this.fish);
    this.run = {
      ...this.run,
      ...summary,
    };
  }

  private levelDuration(): number {
    return 31 + Math.min(18, this.config.level * 0.22);
  }

  private completeLevel(): void {
    if (!this.run) {
      return;
    }

    const fishSummary = summarizeAliveFishCounts(this.fish);
    const lostThisRound = lostFishCountsAfterRound(this.levelStartFishCounts, fishSummary.fishCounts);
    const completedLevel = this.config.level;
    this.run = applyLevelReward(
      applyRoundRecovery(
        {
          ...this.run,
          level: this.run.level + 1,
          ...fishSummary,
          schoolEnergy: clamp(this.run.schoolEnergy + 7, 0, 110),
        },
        lostThisRound,
      ),
      this.config,
    );
    saveRun(this.run);
    this.hideArtifactPanel();
    const rewardMode = rewardFlowForCompletedLevel(completedLevel);

    if (this.run.lastInvestmentReturn > 0) {
      this.screen = "choice";
      renderChoice(this.overlay, {
        run: this.run,
        mode: "investment-return",
        isDevMode: this.mode === "dev",
        onChoose: (choice) => this.choose(choice),
        onContinue: () => this.showIntermission(rewardMode),
        onHome: () => this.returnHome(),
        onEndRun: () => this.endRun(),
      });
      return;
    }

    this.showIntermission(rewardMode);
  }

  private showIntermission(rewardMode = rewardFlowForCompletedLevel(Math.max(0, (this.run?.level ?? 1) - 1))): void {
    if (!this.run) {
      return;
    }

    if (rewardMode === "artifact" && !hasArtifactChoicesRemaining(this.run)) {
      this.run = applyArtifactExhaustionFallback(this.run);
      saveRun(this.run);
      rewardMode = "none";
    }

    this.screen = "choice";
    renderChoice(this.overlay, {
      run: this.run,
      mode: rewardMode,
      isDevMode: this.mode === "dev",
      onChoose: (choice) => this.choose(choice),
      onContinue: () => this.startLevel(),
      onHome: () => this.returnHome(),
      onEndRun: () => this.endRun(),
    });
  }

  private choose(choice: RewardChoiceId): void {
    if (!this.run) {
      return;
    }

    this.run = isArtifactId(choice)
      ? applyArtifactReward(this.run, choice)
      : applyChoice(this.run, choice, { freePurchases: this.mode === "dev" && DEV_FREE_PURCHASES });
    saveRun(this.run);
    this.startLevel();
  }

  private endRun(): void {
    const bestLevel = Math.max(this.run?.bestLevel ?? 1, this.config.level);
    const finalFish = this.run?.fishCount ?? 0;
    const maxFish = this.run?.maxFishCount ?? finalFish;
    clearRun();
    this.screen = "gameover";
    this.hideArtifactPanel();
    renderGameOver(this.overlay, {
      bestLevel,
      finalFish,
      maxFish,
      onHome: () => this.showHome(),
      onNewCampaign: () => this.newCampaign(this.mode),
    });
  }

  private showArtifactAccess(): void {
    this.artifactButton.classList.remove("hidden");
    this.pauseButton.classList.remove("hidden");
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
    const header = document.createElement("div");
    header.className = "artifact-panel-header";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", () => this.closeArtifactPanel());
    header.replaceChildren(title, close);
    const grid = document.createElement("div");
    grid.className = "artifact-grid";

    artifactDefinitions.forEach((artifact) => {
      const artifactCard = document.createElement("div");
      const owned = this.run?.ownedArtifacts.includes(artifact.id) ?? false;
      artifactCard.className = owned ? "artifact-card owned" : "artifact-card";
      artifactCard.tabIndex = 0;

      if (this.mode === "dev") {
        artifactCard.title = owned ? "Click to remove debug artifact" : "Click to add debug artifact";
        artifactCard.addEventListener("click", () => this.toggleOwnedArtifact(artifact.id));
        artifactCard.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.toggleOwnedArtifact(artifact.id);
          }
        });
      } else {
        artifactCard.title = owned ? "Owned artifact" : "Locked artifact";
      }

      const icon = document.createElement("div");
      icon.className = "artifact-icon";
      const iconImage = document.createElement("img");
      iconImage.src = uiIconAssets.treasureChest;
      iconImage.alt = `${artifact.name} artifact`;
      icon.replaceChildren(iconImage);
      const name = document.createElement("strong");
      name.textContent = artifact.name;
      const effect = document.createElement("p");
      effect.textContent = artifact.effect;
      const rarity = document.createElement("span");
      rarity.textContent = artifact.rarity;
      const status = document.createElement("span");
      status.className = "artifact-status";
      status.textContent = owned ? "Owned" : this.mode === "dev" ? "Available" : "Locked";
      const children: HTMLElement[] = [icon, name, effect, rarity, status];

      if (artifact.maxLevel && artifact.maxLevel > 1) {
        const upgrade = document.createElement("span");
        upgrade.className = "artifact-upgrade";
        upgrade.textContent = `Lv ${artifact.level ?? 1}/${artifact.maxLevel} - Upgrade ${artifact.upgradeShellCost ?? 0} Shells`;
        children.push(upgrade);
      }

      artifactCard.replaceChildren(...children);
      grid.append(artifactCard);
    });

    this.artifactPanel.className = "artifact-panel";
    this.artifactPanel.replaceChildren(header, grid);
  }

  private toggleOwnedArtifact(artifactId: (typeof artifactDefinitions)[number]["id"]): void {
    if (!this.run || this.mode !== "dev") {
      return;
    }

    const owned = this.run.ownedArtifacts.includes(artifactId);
    this.run = {
      ...this.run,
      ownedArtifacts: owned ? this.run.ownedArtifacts.filter((candidate) => candidate !== artifactId) : [...this.run.ownedArtifacts, artifactId],
    };
    saveRun(this.run);
    this.closeArtifactPanel();
    this.toggleArtifactPanel();
  }

  private closeArtifactPanel(): void {
    this.artifactPanel.className = "artifact-panel hidden";
    this.artifactPanel.replaceChildren();
  }

  private hideArtifactPanel(): void {
    this.artifactButton.classList.add("hidden");
    this.pauseButton.classList.add("hidden");
    this.closeArtifactPanel();
  }

  private hideDevLevelScroller(): void {
    this.devLevelScroller.replaceChildren();
    this.devLevelScroller.classList.add("hidden");
  }

  private render(time: number): void {
    this.ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    this.updateSmokeDataset();

    if (this.screen === "combat" && this.run) {
      drawCombat(this.ctx, this.width, this.height, this.run, this.config, this.fish, this.sharks, this.waterDisturbance, time, this.kelpGoal);
      return;
    }

    drawIdleScene(this.ctx, this.width, this.height, time);
  }

  private updateSmokeDataset(): void {
    this.canvas.dataset.screen = this.screen;
    this.canvas.dataset.level = String(this.run?.level ?? 0);
    this.canvas.dataset.fishCount = String(this.run?.fishCount ?? 0);
    this.canvas.dataset.fishTotal = String(this.run?.maxFishCount ?? 0);
    this.canvas.dataset.tilapia = String(this.run?.fishCounts.tilapia ?? 0);
    this.canvas.dataset.salmon = String(this.run?.fishCounts.salmon ?? 0);
    this.canvas.dataset.parrotfish = String(this.run?.fishCounts.parrotfish ?? 0);
    this.canvas.dataset.mahi = String(this.run?.fishCounts["mahi-mahi"] ?? 0);
    this.canvas.dataset.grouper = String(this.run?.fishCounts.grouper ?? 0);
    this.canvas.dataset.artifacts = String(this.run?.ownedArtifacts.length ?? 0);
    this.canvas.dataset.feedback = this.run?.lastRecoverySummary || this.run?.lastRecruitmentSummary || "";
    this.canvas.dataset.mode = this.mode;
    this.canvas.dataset.waterEnergy = this.waterDisturbance.energy().toFixed(3);
    this.canvas.dataset.kelpGoal = this.kelpGoal ? `${Math.round(this.kelpGoal.pos.x)},${Math.round(this.kelpGoal.pos.y)}` : "";
    this.canvas.dataset.kelpState = this.kelpGoal?.state ?? "";
    this.canvas.dataset.kelpProgress = (this.kelpGoal?.progress ?? 0).toFixed(3);
    this.canvas.dataset.kelpAlpha = (this.kelpGoal?.alpha ?? 0).toFixed(3);
    const behaviorModes = this.fish.reduce<Record<string, number>>((counts, fish) => {
      if (!fish.caught && fish.behaviorMode) {
        counts[fish.behaviorMode] = (counts[fish.behaviorMode] ?? 0) + 1;
      }

      return counts;
    }, {});
    this.canvas.dataset.behaviorModes = Object.entries(behaviorModes)
      .map(([mode, count]) => `${mode}:${count}`)
      .join(",");
  }

  destroy(): void {
    window.cancelAnimationFrame(this.animationId);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("pointerdown", this.handleCanvasPointer);
    this.canvas.removeEventListener("pointermove", this.handleCanvasPointer);
  }
}
