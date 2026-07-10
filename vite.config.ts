import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "itch" ? "./" : "/SKOOL-A-FISH-GAME/",
}));
