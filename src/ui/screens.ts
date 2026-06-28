import type { ChoiceId, RunState } from "../game/types";

type HomeHandlers = {
  hasSave: boolean;
  onContinue: () => void;
  onNewCampaign: () => void;
  onSaves: () => void;
};

type ChoiceHandlers = {
  run: RunState;
  isRecruitment: boolean;
  onChoose: (choice: ChoiceId) => void;
  onHome: () => void;
  onEndRun: () => void;
};

type SavesHandlers = {
  run: RunState | null;
  onBack: () => void;
};

type GameOverHandlers = {
  bestLevel: number;
  onHome: () => void;
  onNewCampaign: () => void;
};

type PauseHandlers = {
  onContinue: () => void;
  onHome: () => void;
  onEndRun: () => void;
};

const button = (label: string, onClick: () => void, disabled = false): HTMLButtonElement => {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.disabled = disabled;
  element.addEventListener("click", onClick);
  return element;
};

const title = (text: string): HTMLHeadingElement => {
  const element = document.createElement("h1");
  element.textContent = text;
  return element;
};

const note = (text: string): HTMLParagraphElement => {
  const element = document.createElement("p");
  element.textContent = text;
  return element;
};

export const clearOverlay = (overlay: HTMLElement): void => {
  overlay.replaceChildren();
  overlay.className = "overlay hidden";
};

export const renderHome = (overlay: HTMLElement, handlers: HomeHandlers): void => {
  overlay.className = "overlay menu";
  overlay.replaceChildren(
    title("SKOOL-A"),
    button("Continue Campaign", handlers.onContinue, !handlers.hasSave),
    button("New Campaign", handlers.onNewCampaign),
    button("Saves", handlers.onSaves),
  );
};

export const renderChoice = (overlay: HTMLElement, handlers: ChoiceHandlers): void => {
  overlay.className = "overlay menu compact";

  if (handlers.isRecruitment) {
    overlay.replaceChildren(
      title(`Level ${handlers.run.level}`),
      button("+5 Tilapia", () => handlers.onChoose("tilapia")),
      button("+3 Salmon", () => handlers.onChoose("salmon")),
      button("+1 Grouper", () => handlers.onChoose("grouper")),
      button("+1 Support", () => handlers.onChoose("support")),
      button("Home", handlers.onHome),
      button("End Run", handlers.onEndRun),
    );
    return;
  }

  overlay.replaceChildren(
    title(`Level ${handlers.run.level}`),
    button("Artifact", () => handlers.onChoose("artifact"), handlers.run.currency < 8),
    button("Invest", () => handlers.onChoose("invest")),
    button("Heal", () => handlers.onChoose("heal"), handlers.run.currency < 5),
    button("Home", handlers.onHome),
    button("End Run", handlers.onEndRun),
  );
};

export const renderSaves = (overlay: HTMLElement, handlers: SavesHandlers): void => {
  overlay.className = "overlay menu compact";

  if (!handlers.run) {
    overlay.replaceChildren(title("Saves"), note("No save"), button("Back", handlers.onBack));
    return;
  }

  overlay.replaceChildren(
    title("Saves"),
    note(`Level ${handlers.run.level}`),
    note(`Best ${handlers.run.bestLevel}`),
    button("Back", handlers.onBack),
  );
};

export const renderGameOver = (overlay: HTMLElement, handlers: GameOverHandlers): void => {
  overlay.className = "overlay menu compact";
  overlay.replaceChildren(
    title("Run Ended"),
    note(`Best ${handlers.bestLevel}`),
    button("New Campaign", handlers.onNewCampaign),
    button("Home", handlers.onHome),
  );
};

export const renderPause = (overlay: HTMLElement, handlers: PauseHandlers): void => {
  overlay.className = "overlay menu compact";
  overlay.replaceChildren(
    title("Paused"),
    button("Continue", handlers.onContinue),
    button("Home", handlers.onHome),
    button("End Run", handlers.onEndRun),
  );
};
