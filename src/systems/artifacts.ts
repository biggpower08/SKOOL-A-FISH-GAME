import type { ArtifactId } from "../game/types";

export type ArtifactDefinition = {
  id: ArtifactId;
  name: string;
  iconKey: string;
  rarity: "common" | "rare" | "legendary";
  category: string;
  effect: string;
  level?: number;
  maxLevel?: number;
  upgradeShellCost?: number;
  upgradeText?: string;
};

export const artifactDefinitions: ArtifactDefinition[] = [
  { id: "shark-tooth-charm", name: "Shark Tooth Charm", iconKey: "tooth", rarity: "common", category: "shark hunger drain", effect: "Sharks tire a little faster." },
  {
    id: "bubble-net",
    name: "Bubble Net",
    iconKey: "net",
    rarity: "common",
    category: "fish evasion",
    effect: "Threatened fish flee harder.",
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
    effect: "School cohesion improves.",
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
    effect: "Round Shell rewards improve.",
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
    effect: "Kelp recovery improves.",
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
    effect: "Fast fish endure pressure.",
    level: 1,
    maxLevel: 3,
    upgradeShellCost: 120,
    upgradeText: "Improves fast fish survival.",
  },
  { id: "suspicious-sea-coupon", name: "Suspicious Sea Coupon", iconKey: "coupon", rarity: "common", category: "artifact/shop economy", effect: "Shop prices feel friendlier." },
  { id: "peaceful-panic-whistle", name: "Peaceful Panic Whistle", iconKey: "whistle", rarity: "rare", category: "fish evasion", effect: "Panic turns into cleaner dodges." },
  { id: "tiny-reef-lawyer", name: "Tiny Reef Lawyer", iconKey: "brief", rarity: "rare", category: "risky satirical", effect: "First bad bite is disputed." },
  { id: "emergency-kelp-jar", name: "Emergency Kelp Jar", iconKey: "jar", rarity: "common", category: "kelp recovery", effect: "Kelp restores one extra fish." },
  { id: "moon-tide-beads", name: "Moon Tide Beads", iconKey: "beads", rarity: "rare", category: "fish schooling", effect: "Wide schools pull together." },
  { id: "rubber-shark-nose", name: "Rubber Shark Nose", iconKey: "nose", rarity: "common", category: "shark speed reduction", effect: "Basic sharks turn slower." },
  { id: "cosmic-sardine", name: "Cosmic Sardine", iconKey: "sardine", rarity: "legendary", category: "fish speed", effect: "All fish gain a tiny burst." },
  { id: "fin-friendship-bracelet", name: "Fin Friendship Bracelet", iconKey: "bracelet", rarity: "common", category: "fish schooling", effect: "Nearby fish separate cleaner." },
  { id: "totally-real-treasure-map", name: "Totally Real Treasure Map", iconKey: "map", rarity: "rare", category: "Shell rewards", effect: "Reward nodes pay more Shells." },
  { id: "anti-chomp-anklet", name: "Anti-Chomp Anklet", iconKey: "anklet", rarity: "rare", category: "fish health", effect: "Fragile fish gain bite grace." },
  { id: "seaweed-savings-bond", name: "Seaweed Savings Bond", iconKey: "bond", rarity: "common", category: "artifact/shop economy", effect: "Investments mature cleaner." },
  { id: "panic-disco-ball", name: "Panic Disco Ball", iconKey: "disco", rarity: "rare", category: "risky satirical", effect: "Panic spreads, then scatters." },
  { id: "coral-gym-membership", name: "Coral Gym Membership", iconKey: "gym", rarity: "common", category: "fish health", effect: "Tank fish gain stamina." },
  { id: "bubble-wrap-doctrine", name: "Bubble Wrap Doctrine", iconKey: "wrap", rarity: "common", category: "normal fish support", effect: "Normal fish survive scrapes." },
  { id: "reef-speed-limit", name: "Reef Speed Limit", iconKey: "limit", rarity: "common", category: "shark speed reduction", effect: "Fast sharks lose some zip." },
  { id: "kelp-credit-card", name: "Kelp Credit Card", iconKey: "card", rarity: "rare", category: "artifact/shop economy", effect: "Buy now, regret later." },
  { id: "tidal-training-wheels", name: "Tidal Training Wheels", iconKey: "wheel", rarity: "common", category: "fish speed", effect: "Slow fish get a small boost." },
  { id: "glow-plankton-plan", name: "Glow Plankton Plan", iconKey: "glow", rarity: "common", category: "recruitment bonuses", effect: "Recruit choices show cleaner." },
  { id: "reef-union-card", name: "Reef Union Card", iconKey: "union", rarity: "rare", category: "normal fish support", effect: "Common fish hold formation." },
  { id: "mellow-current-fan", name: "Mellow Current Fan", iconKey: "fan", rarity: "common", category: "fish schooling", effect: "Alignment feels smoother." },
  { id: "dramatic-fin-cape", name: "Dramatic Fin Cape", iconKey: "cape", rarity: "rare", category: "risky satirical", effect: "Bold fish bait danger." },
  { id: "shark-nap-schedule", name: "Shark Nap Schedule", iconKey: "nap", rarity: "rare", category: "shark hunger drain", effect: "Hungry sharks fade faster." },
  { id: "salmon-lane-pass", name: "Salmon Lane Pass", iconKey: "lane", rarity: "common", category: "normal fish support", effect: "Salmon dodge with purpose." },
  { id: "tilapia-town-charter", name: "Tilapia Town Charter", iconKey: "charter", rarity: "common", category: "normal fish support", effect: "Tilapia count matters more." },
  { id: "grouper-hard-hat", name: "Grouper Hard Hat", iconKey: "hat", rarity: "rare", category: "tank fish support", effect: "Grouper absorbs pressure." },
  { id: "mahi-sprint-sticker", name: "Mahi Sprint Sticker", iconKey: "sticker", rarity: "common", category: "fast fish support", effect: "Mahi keeps top speed longer." },
  { id: "parrotfish-mood-ring", name: "Parrotfish Mood Ring", iconKey: "ring", rarity: "rare", category: "fast fish support", effect: "Parrotfish panic cleaner." },
  { id: "barnacle-bankroll", name: "Barnacle Bankroll", iconKey: "bank", rarity: "common", category: "Shell rewards", effect: "Small Shell bonus after wins." },
  { id: "chill-current-permit", name: "Chill Current Permit", iconKey: "permit", rarity: "common", category: "fish schooling", effect: "Less jitter near edges." },
  { id: "fake-moustache-shark", name: "Fake Moustache Shark", iconKey: "mask", rarity: "rare", category: "risky satirical", effect: "Targeting gets confused." },
  { id: "kelp-receipt-folder", name: "Kelp Receipt Folder", iconKey: "folder", rarity: "common", category: "kelp recovery", effect: "Kelp costs track better." },
  { id: "snail-mail-invite", name: "Snail Mail Invite", iconKey: "invite", rarity: "common", category: "recruitment bonuses", effect: "Recruitment feels steadier." },
  { id: "pearl-panic-button", name: "Pearl Panic Button", iconKey: "button", rarity: "rare", category: "fish evasion", effect: "Late panic gives burst space." },
  { id: "shark-yawn-manual", name: "Shark Yawn Manual", iconKey: "manual", rarity: "common", category: "shark hunger drain", effect: "Shark hunger slips faster." },
  { id: "reef-rent-control", name: "Reef Rent Control", iconKey: "rent", rarity: "rare", category: "artifact/shop economy", effect: "Artifacts stay affordable." },
  { id: "soft-coral-bumper", name: "Soft Coral Bumper", iconKey: "bumper", rarity: "common", category: "fish health", effect: "Overlaps bump instead of blob." },
  { id: "hydrated-hype-man", name: "Hydrated Hype Man", iconKey: "hype", rarity: "common", category: "fish speed", effect: "Low energy hurts less." },
  { id: "shark-detour-sign", name: "Shark Detour Sign", iconKey: "detour", rarity: "rare", category: "shark speed reduction", effect: "Closest shark overshoots." },
  { id: "cosmic-kelp-thermos", name: "Cosmic Kelp Thermos", iconKey: "thermos", rarity: "legendary", category: "kelp recovery", effect: "Recovery can spike big." },
  { id: "budget-oracle-shell", name: "Budget Oracle Shell", iconKey: "oracle", rarity: "rare", category: "Shell rewards", effect: "Rewards forecast better." },
  { id: "school-spirit-sash", name: "School Spirit Sash", iconKey: "sash", rarity: "common", category: "fish schooling", effect: "Large schools stay readable." },
  { id: "dubious-life-coach", name: "Dubious Life Coach", iconKey: "coach", rarity: "rare", category: "risky satirical", effect: "Bad advice, good dodges." },
  { id: "tin-foil-fin", name: "Tin Foil Fin", iconKey: "foil", rarity: "common", category: "fish evasion", effect: "Outer fish dodge sooner." },
  { id: "reef-afterparty-pass", name: "Reef Afterparty Pass", iconKey: "party", rarity: "legendary", category: "recruitment bonuses", effect: "Recruit nodes feel richer." },
];

export const isArtifactId = (value: string): value is ArtifactId =>
  artifactDefinitions.some((artifact) => artifact.id === value);
