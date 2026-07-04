const assetBase = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

export const uiIconAssets = {
  fishCounter: assetBase("assets/ui/fish_counter_icon_transparent.png"),
  kelp: assetBase("assets/ui/kelp_icon_transparent.png"),
  shell: assetBase("assets/ui/shell_icon_transparent.png"),
  treasureChest: assetBase("assets/ui/treasure_chest_icon_transparent.png"),
} as const;

export const cleanedSharkAssets = {
  bill: assetBase("assets/sharks/bill_bandana_shark_clean.png"),
  grog: assetBase("assets/sharks/grog_steampunk_hat_shark_clean.png"),
  steezy: assetBase("assets/sharks/steezy_nose_piercing_shark_clean.png"),
} as const;
