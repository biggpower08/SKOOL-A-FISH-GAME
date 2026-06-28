import { Game } from "./game/Game";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("App root is missing.");
}

const game = new Game(app);
game.start();
