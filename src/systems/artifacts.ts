import type { ArtifactId } from "../game/types";

export type ArtifactBuildTag =
  | "balanced-school"
  | "tilapia-swarm"
  | "parrotfish-evasion"
  | "grouper-protector"
  | "mahi-tempo"
  | "salmon-generalist"
  | "shell-economy"
  | "kelp-recovery"
  | "anti-shark-survival"
  | "risky-joke";

export const artifactBuildArchetypes: ArtifactBuildTag[] = [
  "balanced-school",
  "tilapia-swarm",
  "parrotfish-evasion",
  "grouper-protector",
  "mahi-tempo",
  "salmon-generalist",
  "shell-economy",
  "kelp-recovery",
  "anti-shark-survival",
  "risky-joke",
];

export const artifactBuildTagLabels: Record<ArtifactBuildTag, string> = {
  "balanced-school": "Balanced school",
  "tilapia-swarm": "Tilapia swarm",
  "parrotfish-evasion": "Parrotfish dodge",
  "grouper-protector": "Grouper guard",
  "mahi-tempo": "Mahi tempo",
  "salmon-generalist": "Salmon generalist",
  "shell-economy": "Shell economy",
  "kelp-recovery": "Kelp recovery",
  "anti-shark-survival": "Anti-shark survival",
  "risky-joke": "Risky nonsense",
};

export type ArtifactDefinition = {
  id: ArtifactId;
  name: string;
  iconKey: string;
  rarity: "common" | "rare" | "legendary";
  category: string;
  effect: string;
  buildTags: ArtifactBuildTag[];
  level?: number;
  maxLevel?: number;
  upgradeShellCost?: number;
  upgradeText?: string;
};

type ArtifactSeed = Omit<ArtifactDefinition, "buildTags"> & {
  buildTags?: ArtifactBuildTag[];
};

const categoryBuildTags = (category: string): ArtifactBuildTag[] => {
  if (category.includes("Shell") || category.includes("economy")) {
    return ["shell-economy"];
  }

  if (category.includes("kelp")) {
    return ["kelp-recovery"];
  }

  if (category.includes("shark")) {
    return ["anti-shark-survival"];
  }

  if (category.includes("evasion")) {
    return ["parrotfish-evasion", "anti-shark-survival"];
  }

  if (category.includes("schooling")) {
    return ["balanced-school"];
  }

  if (category.includes("fast") || category.includes("speed")) {
    return ["parrotfish-evasion", "mahi-tempo"];
  }

  if (category.includes("tank") || category.includes("health")) {
    return ["grouper-protector", "anti-shark-survival"];
  }

  if (category.includes("normal")) {
    return ["salmon-generalist", "balanced-school"];
  }

  if (category.includes("recruitment")) {
    return ["balanced-school", "tilapia-swarm"];
  }

  if (category.includes("risky")) {
    return ["risky-joke"];
  }

  return ["balanced-school"];
};

const artifactTagOverrides: Partial<Record<ArtifactId, ArtifactBuildTag[]>> = {
  "bubble-net": ["parrotfish-evasion", "anti-shark-survival"],
  "school-bell": ["balanced-school", "salmon-generalist"],
  "pearl-cache": ["shell-economy"],
  "kelp-bandage": ["kelp-recovery"],
  "drift-scale": ["parrotfish-evasion", "mahi-tempo"],
  "salmon-lane-pass": ["salmon-generalist", "balanced-school"],
  "tilapia-town-charter": ["tilapia-swarm"],
  "grouper-hard-hat": ["grouper-protector"],
  "mahi-sprint-sticker": ["mahi-tempo"],
  "parrotfish-mood-ring": ["parrotfish-evasion"],
};

const buildTagsForArtifact = (artifact: ArtifactSeed): ArtifactBuildTag[] =>
  Array.from(new Set([...(artifact.buildTags ?? []), ...(artifactTagOverrides[artifact.id] ?? []), ...categoryBuildTags(artifact.category)]));

const artifactSeeds: ArtifactSeed[] = [
  { id: "shark-tooth-charm", name: "Shark Tooth Charm", iconKey: "tooth", rarity: "common", category: "shark hunger drain", effect: "Adds +4.5% shark hunger drain through anti-shark tags." },
  {
    id: "bubble-net",
    name: "Bubble Net",
    iconKey: "net",
    rarity: "common",
    category: "fish evasion",
    effect: "Adds +3.5% catch resistance and parrotfish evasion support.",
    level: 1,
    maxLevel: 3,
    upgradeShellCost: 90,
    upgradeText: "Improves flee strength.",
  },
  {
    id: "school-bell",
    name: "School Bell",
    iconKey: "bell",
    rarity: "common",
    category: "fish schooling",
    effect: "Balanced-school tags add +1.5% speed and +0.12 health to each fish type.",
    level: 1,
    maxLevel: 3,
    upgradeShellCost: 85,
    upgradeText: "Improves school pull.",
  },
  {
    id: "pearl-cache",
    name: "Pearl Cache",
    iconKey: "pearl",
    rarity: "rare",
    category: "Shell rewards",
    effect: "Shell-economy tags add +8% Shell rewards each, up to +45%.",
    level: 1,
    maxLevel: 4,
    upgradeShellCost: 130,
    upgradeText: "Raises Shell payouts.",
  },
  {
    id: "kelp-bandage",
    name: "Kelp Bandage",
    iconKey: "kelp",
    rarity: "common",
    category: "kelp recovery",
    effect: "Kelp-recovery tags restore +2 missing fish each, up to +6.",
    level: 1,
    maxLevel: 3,
    upgradeShellCost: 75,
    upgradeText: "Improves healing value.",
  },
  {
    id: "drift-scale",
    name: "Drift Scale",
    iconKey: "scale",
    rarity: "rare",
    category: "fast fish support",
    effect: "Fast-fish tags add up to +18% parrotfish speed and +22% Mahi-Mahi speed.",
    level: 1,
    maxLevel: 3,
    upgradeShellCost: 120,
    upgradeText: "Improves fast fish survival.",
  },
  { id: "suspicious-sea-coupon", name: "Suspicious Sea Coupon", iconKey: "coupon", rarity: "common", category: "artifact/shop economy", effect: "Counts as +1 Shell-economy tag for +8% round rewards." },
  { id: "peaceful-panic-whistle", name: "Peaceful Panic Whistle", iconKey: "whistle", rarity: "rare", category: "fish evasion", effect: "+3.5% catch resistance tag." },
  { id: "tiny-reef-lawyer", name: "Tiny Reef Lawyer", iconKey: "brief", rarity: "rare", category: "risky satirical", effect: "Risky tags add +4 Shells after wins, up to +20." },
  { id: "emergency-kelp-jar", name: "Emergency Kelp Jar", iconKey: "jar", rarity: "common", category: "kelp recovery", effect: "Kelp restores +2 missing fish, stacking up to +6." },
  { id: "moon-tide-beads", name: "Moon Tide Beads", iconKey: "beads", rarity: "rare", category: "fish schooling", effect: "Adds one balanced-school tag: +1.5% speed and +0.12 health." },
  { id: "rubber-shark-nose", name: "Rubber Shark Nose", iconKey: "nose", rarity: "common", category: "shark speed reduction", effect: "Anti-shark tags slow sharks by 2.5% each, up to 22%." },
  { id: "cosmic-sardine", name: "Cosmic Sardine", iconKey: "sardine", rarity: "legendary", category: "fish speed", effect: "Speed tags add up to +18% parrotfish and +22% Mahi-Mahi speed." },
  { id: "fin-friendship-bracelet", name: "Fin Friendship Bracelet", iconKey: "bracelet", rarity: "common", category: "fish schooling", effect: "Adds balanced-school bonuses: +1.5% speed and +0.12 health." },
  { id: "totally-real-treasure-map", name: "Totally Real Treasure Map", iconKey: "map", rarity: "rare", category: "Shell rewards", effect: "Adds +8% Shell rewards through Shell-economy tags." },
  { id: "anti-chomp-anklet", name: "Anti-Chomp Anklet", iconKey: "anklet", rarity: "rare", category: "fish health", effect: "Health tags add grouper/salmon durability and +3.5% catch resistance." },
  { id: "seaweed-savings-bond", name: "Seaweed Savings Bond", iconKey: "bond", rarity: "common", category: "artifact/shop economy", effect: "Adds +8% Shell rewards while investments are still simple 100 -> 200 returns." },
  { id: "panic-disco-ball", name: "Panic Disco Ball", iconKey: "disco", rarity: "rare", category: "risky satirical", effect: "Risky tags add +4 Shells after wins, cap +20." },
  { id: "coral-gym-membership", name: "Coral Gym Membership", iconKey: "gym", rarity: "common", category: "fish health", effect: "Health tags add +0.75 Grouper health each." },
  { id: "bubble-wrap-doctrine", name: "Bubble Wrap Doctrine", iconKey: "wrap", rarity: "common", category: "normal fish support", effect: "Salmon tags add +0.45 health each." },
  { id: "reef-speed-limit", name: "Reef Speed Limit", iconKey: "limit", rarity: "common", category: "shark speed reduction", effect: "Anti-shark tags slow sharks by 2.5% each, up to 22%." },
  { id: "kelp-credit-card", name: "Kelp Credit Card", iconKey: "card", rarity: "rare", category: "artifact/shop economy", effect: "Adds +8% Shell rewards; does not create debt yet." },
  { id: "tidal-training-wheels", name: "Tidal Training Wheels", iconKey: "wheel", rarity: "common", category: "fish speed", effect: "Speed tags add Mahi speed up to +22%." },
  { id: "glow-plankton-plan", name: "Glow Plankton Plan", iconKey: "glow", rarity: "common", category: "recruitment bonuses", effect: "Recruitment tags add +1 Tilapia bundles." },
  { id: "reef-union-card", name: "Reef Union Card", iconKey: "union", rarity: "rare", category: "normal fish support", effect: "Salmon tags add +0.025 protection each." },
  { id: "mellow-current-fan", name: "Mellow Current Fan", iconKey: "fan", rarity: "common", category: "fish schooling", effect: "Balanced tags add +1.5% speed each." },
  { id: "dramatic-fin-cape", name: "Dramatic Fin Cape", iconKey: "cape", rarity: "rare", category: "risky satirical", effect: "Risky tags add +4 Shells after wins." },
  { id: "shark-nap-schedule", name: "Shark Nap Schedule", iconKey: "nap", rarity: "rare", category: "shark hunger drain", effect: "Adds +4.5% shark hunger drain through anti-shark tags." },
  { id: "salmon-lane-pass", name: "Salmon Lane Pass", iconKey: "lane", rarity: "common", category: "normal fish support", effect: "Salmon gains +0.45 health per tag." },
  { id: "tilapia-town-charter", name: "Tilapia Town Charter", iconKey: "charter", rarity: "common", category: "normal fish support", effect: "Tilapia recruits +1 and gains +0.18 health." },
  { id: "grouper-hard-hat", name: "Grouper Hard Hat", iconKey: "hat", rarity: "rare", category: "tank fish support", effect: "Grouper gains +0.75 health per tag." },
  { id: "mahi-sprint-sticker", name: "Mahi Sprint Sticker", iconKey: "sticker", rarity: "common", category: "fast fish support", effect: "Mahi gains +4.5% speed per tag." },
  { id: "parrotfish-mood-ring", name: "Parrotfish Mood Ring", iconKey: "ring", rarity: "rare", category: "fast fish support", effect: "Parrotfish gains +3.5% speed per tag." },
  { id: "barnacle-bankroll", name: "Barnacle Bankroll", iconKey: "bank", rarity: "common", category: "Shell rewards", effect: "Adds +8% Shell rewards through Shell-economy tags." },
  { id: "chill-current-permit", name: "Current Coach Permit", iconKey: "permit", rarity: "common", category: "fish evasion", effect: "Adds +3.5% catch resistance and evasion-tag support." },
  { id: "fake-moustache-shark", name: "Fake Moustache Shark", iconKey: "mask", rarity: "rare", category: "risky satirical", effect: "Risky tags add +4 Shells after wins." },
  { id: "kelp-receipt-folder", name: "Kelp Receipt Folder", iconKey: "folder", rarity: "common", category: "kelp recovery", effect: "Kelp restores +2 missing fish per tag." },
  { id: "snail-mail-invite", name: "Snail Mail Invite", iconKey: "invite", rarity: "common", category: "recruitment bonuses", effect: "Recruitment tags add +1 Tilapia bundles." },
  { id: "pearl-panic-button", name: "Pearl Panic Button", iconKey: "button", rarity: "rare", category: "fish evasion", effect: "Evasion tags add +3.5% catch resistance." },
  { id: "shark-yawn-manual", name: "Shark Yawn Manual", iconKey: "manual", rarity: "common", category: "shark hunger drain", effect: "Adds +4.5% shark hunger drain through anti-shark tags." },
  { id: "reef-rent-control", name: "Reef Rent Control", iconKey: "rent", rarity: "rare", category: "artifact/shop economy", effect: "Adds +8% Shell rewards; artifact prices are not discounted yet." },
  { id: "soft-coral-bumper", name: "Coral Guard Charm", iconKey: "bumper", rarity: "common", category: "fish health", effect: "Health tags add up to +3 grouper health and +2 salmon health." },
  { id: "hydrated-hype-man", name: "Hydrated Hype Man", iconKey: "hype", rarity: "common", category: "fish speed", effect: "Speed tags add Mahi speed up to +22%." },
  { id: "shark-detour-sign", name: "Shark Detour Sign", iconKey: "detour", rarity: "rare", category: "shark speed reduction", effect: "Anti-shark tags slow sharks 2.5% each." },
  { id: "cosmic-kelp-thermos", name: "Cosmic Kelp Thermos", iconKey: "thermos", rarity: "legendary", category: "kelp recovery", effect: "Kelp restores +2 missing fish, stacking up to +6." },
  { id: "budget-oracle-shell", name: "Budget Oracle Shell", iconKey: "oracle", rarity: "rare", category: "Shell rewards", effect: "Adds +8% Shell rewards through Shell-economy tags." },
  { id: "school-spirit-sash", name: "Rally Spirit Sash", iconKey: "sash", rarity: "common", category: "fish schooling", effect: "Adds balanced-school bonuses: +1.5% speed and +0.12 health." },
  { id: "dubious-life-coach", name: "Dubious Life Coach", iconKey: "coach", rarity: "rare", category: "risky satirical", effect: "Risky tags add +4 Shells after wins." },
  { id: "tin-foil-fin", name: "Tin Foil Fin", iconKey: "foil", rarity: "common", category: "fish evasion", effect: "Evasion tags add +3.5% catch resistance." },
  { id: "reef-afterparty-pass", name: "Reef Afterparty Pass", iconKey: "party", rarity: "legendary", category: "recruitment bonuses", effect: "Recruitment tags add +1 Tilapia bundles." },
];

export const artifactDefinitions: ArtifactDefinition[] = artifactSeeds.map((artifact) => ({
  ...artifact,
  buildTags: buildTagsForArtifact(artifact),
}));

export const isArtifactId = (value: string): value is ArtifactId =>
  artifactDefinitions.some((artifact) => artifact.id === value);
