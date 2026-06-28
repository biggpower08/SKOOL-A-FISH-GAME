export type Vector = {
  x: number;
  y: number;
};

export type FishKind = "basic" | "support" | "future";
export type FishTypeId = "tilapia" | "salmon" | "parrotfish" | "mahi-mahi" | "grouper" | "support";
export type FishClass = "normal" | "common" | "fast" | "tank" | "support";
export type SharkKind = "basic" | "fast" | "center" | "barracuda" | "eel";
export type LevelType = "fight" | "shop" | "investment" | "special" | "reward" | "recruit";
export type GameScreen = "home" | "saves" | "combat" | "choice" | "pause" | "gameover";
export type ChoiceId = "tilapia" | "salmon" | "grouper" | "support" | "artifact" | "invest" | "heal";

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
  threatened: boolean;
  caught: boolean;
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
  starved: boolean;
};

export type RunState = {
  level: number;
  fishCount: number;
  supportCount: number;
  fishCounts: Partial<Record<FishTypeId, number>>;
  currency: number;
  invested: number;
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
