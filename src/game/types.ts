export type Vector = {
  x: number;
  y: number;
};

export type FishKind = "basic" | "support" | "future";
export type SharkKind = "basic" | "difficult";
export type LevelType = "fight" | "shop" | "investment" | "special" | "reward";
export type GameScreen = "home" | "saves" | "combat" | "choice" | "gameover";
export type ChoiceId = "fish" | "invest" | "shop";

export type LevelConfig = {
  level: number;
  type: LevelType;
  sharkCount: number;
  sharkHealth: number;
  sharkSpeed: number;
  sharkAttackRate: number;
  fishThreatRadius: number;
  rewardCurrency: number;
};

export type Fish = {
  id: string;
  kind: FishKind;
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
  speed: number;
  attackCooldown: number;
  attackRate: number;
  attackRadius: number;
};

export type RunState = {
  level: number;
  fishCount: number;
  supportCount: number;
  currency: number;
  invested: number;
  schoolEnergy: number;
  bestLevel: number;
};

export type Bounds = {
  width: number;
  height: number;
};
