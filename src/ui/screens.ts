import type { ArtifactId, RewardChoiceId, RewardFlow, RunState } from "../game/types";
import { artifactDefinitions } from "../systems/artifacts";
import { type ActiveFishTypeId, fishTypes } from "../systems/fishTypes";

type HomeHandlers = {
  hasSave: boolean;
  onContinue: () => void;
  onNewCampaign: () => void;
  onSaves: () => void;
};

type ChoiceHandlers = {
  run: RunState;
  mode: RewardFlow;
  onChoose: (choice: RewardChoiceId) => void;
  onContinue: () => void;
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

const card = (className: string, children: HTMLElement[]): HTMLDivElement => {
  const element = document.createElement("div");
  element.className = className;
  element.replaceChildren(...children);
  return element;
};

const clickableCard = (className: string, children: HTMLElement[], onClick: () => void): HTMLDivElement => {
  const element = card(className, children);
  element.tabIndex = 0;
  element.addEventListener("click", (event) => {
    if (event.target instanceof HTMLButtonElement) {
      return;
    }

    onClick();
  });
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  });
  return element;
};

const marker = (className: string, text: string): HTMLDivElement => {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = text;
  return element;
};

const small = (text: string): HTMLParagraphElement => {
  const element = note(text);
  element.className = "small-note";
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

  if (handlers.mode === "recruit") {
    const options: Array<{ id: ActiveFishTypeId; amount: number; subtitle: string }> = [
      { id: "tilapia", amount: 5, subtitle: "Stable schooling, low health." },
      { id: "salmon", amount: 3, subtitle: "Balanced generalist." },
      { id: "parrotfish", amount: 2, subtitle: "Fast evasion fish." },
      { id: "mahi-mahi", amount: 2, subtitle: "Very fast, fragile." },
      { id: "grouper", amount: 1, subtitle: "Slow durable tank." },
    ];

    overlay.replaceChildren(
      title("Adopt Fish"),
      card(
        "choice-grid",
        options.map((option) => {
          const definition = fishTypes[option.id];
          return card("choice-card", [
            marker("fish-card-marker", "o"),
            note(definition.label),
            small(definition.className),
            small(option.subtitle),
            small(`+${option.amount} fish`),
            button("Adopt", () => handlers.onChoose(option.id)),
          ]);
        }),
      ),
      button("Home", handlers.onHome),
      button("End Run", handlers.onEndRun),
    );
    return;
  }

  if (handlers.mode === "artifact") {
    const choices = artifactDefinitions.filter((artifact) => !handlers.run.ownedArtifacts.includes(artifact.id)).slice(0, 3);

    overlay.replaceChildren(
      title("Choose Artifact"),
      card(
        "choice-grid artifact-choice-grid",
        choices.map((artifact) => {
          const chooseArtifact = () => handlers.onChoose(artifact.id as ArtifactId);
          return clickableCard("choice-card clickable-choice-card", [
            marker("artifact-card-marker", "*"),
            note(artifact.name),
            small(artifact.rarity),
            small(artifact.effect),
            button("Take", chooseArtifact),
          ], chooseArtifact);
        }),
      ),
      button("Home", handlers.onHome),
      button("End Run", handlers.onEndRun),
    );
    return;
  }

  if (handlers.mode === "investment-return") {
    overlay.replaceChildren(
      title("Investment Returned"),
      note(`+${handlers.run.lastInvestmentReturn} Shells`),
      button("Continue", handlers.onContinue),
      button("Home", handlers.onHome),
      button("End Run", handlers.onEndRun),
    );
    return;
  }

  const missingFish = Math.max(0, handlers.run.maxFishCount - handlers.run.fishCount);
  const canKelp = handlers.run.currency >= 100 && missingFish > 0;
  const canInvest = handlers.run.currency >= 100 && handlers.run.invested === 0;

  overlay.replaceChildren(
    title("Break"),
    note(`Fish ${handlers.run.fishCount}/${handlers.run.maxFishCount}`),
    card("choice-grid small-choice-grid", [
      card("choice-card", [
        marker("fish-card-marker", "o"),
        note("Feed Kelp"),
        small("100 Shells"),
        small(`Recover up to ${Math.min(5, missingFish)} fish`),
        button("Feed Kelp", () => handlers.onChoose("heal"), !canKelp),
      ]),
      card("choice-card", [
        marker("artifact-card-marker", "S"),
        note("Questionable Investment"),
        small("100 Shells now"),
        small("+200 after 3 rounds"),
        button("Invest Shells", () => handlers.onChoose("invest"), !canInvest),
      ]),
      card("choice-card", [
        marker("artifact-card-marker", ">"),
        note("Continue"),
        small("Skip spending"),
        small("The school endures."),
        button("Continue", handlers.onContinue),
      ]),
    ]),
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
