export type Vector = {
  x: number;
  y: number;
};

export type FishKind = "basic" | "support" | "future";
export type FishTypeId = "tilapia" | "salmon" | "parrotfish" | "mahi-mahi" | "grouper" | "support";
export type FishClass = "normal" | "common" | "fast" | "tank" | "support";
export type FishBehaviorMode = "forage" | "school" | "alert" | "flee" | "recover";
export type ArtifactId = string;
export type SharkKind = "basic" | "fast" | "center" | "barracuda" | "eel";
export type LevelType = "fight" | "shop" | "investment" | "special" | "reward" | "recruit";
export type GameScreen = "home" | "saves" | "combat" | "choice" | "pause" | "gameover";
export type ChoiceId = FishTypeId | "artifact" | "invest" | "heal";
export type RewardChoiceId = ChoiceId | ArtifactId;
export type RewardFlow = "none" | "artifact" | "recruit" | "investment-return";
export type GameMode = "player" | "dev";

export type LevelConfig = {
  level: number;
  type: LevelType;
  sharkCount: number;
  sharkHealth: number;
  sharkSpeed: number;
  sharkAttackRate: number;
  fishThreatRadius: number;
  rewardCurrency: number;
  sharkTypes: SharkKind[];
};

export type Fish = {
  id: string;
  kind: FishKind;
  typeId: FishTypeId;
  className: FishClass;
  pos: Vector;
  vel: Vector;
  radius: number;
  maxSpeed: number;
  health: number;
  maxHealth: number;
  evasion?: number;
  protection?: number;
  threatened: boolean;
  caught: boolean;
  caughtTimer?: number;
  facingX?: 1 | -1;
  behaviorMode?: FishBehaviorMode;
};

export type Shark = {
  id: string;
  kind: SharkKind;
  pos: Vector;
  vel: Vector;
  radius: number;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  hungerDrain: number;
  speed: number;
  acceleration: number;
  attackCooldown: number;
  attackRate: number;
  attackRadius: number;
  feedingRecovery?: number;
  contactCooldown?: number;
  facingX?: 1 | -1;
  starved: boolean;
};

export type SpriteManifestEntry = {
  spriteKey: string;
  src: string;
  frameCount: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  fallbackColor: string;
  visualScale: number;
  rippleScale: number;
};

export type RunState = {
  level: number;
  fishCount: number;
  maxFishCount: number;
  supportCount: number;
  fishCounts: Partial<Record<FishTypeId, number>>;
  lostFishCounts: Partial<Record<FishTypeId, number>>;
  ownedArtifacts: ArtifactId[];
  currency: number;
  invested: number;
  investmentReturnLevel: number | null;
  lastInvestmentReturn: number;
  lastRecruitmentSummary: string;
  lastRecoverySummary: string;
  schoolEnergy: number;
  bestLevel: number;
};

export type Bounds = {
  width: number;
  height: number;
};

export type LevelPathStep = {
  level: number;
  type: LevelType;
  icon: string;
  label: string;
  current: boolean;
};
