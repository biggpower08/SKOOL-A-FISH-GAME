import type { ArtifactId, RewardChoiceId, RewardFlow, RunState } from "../game/types";
import { artifactBuildTagLabels, artifactDefinitions } from "../systems/artifacts";
import { type ActiveFishTypeId, fishTypes, formatFishCountSummary, recruitmentChoices } from "../systems/fishTypes";
import { getFishSprite } from "../rendering/sprites";

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
  finalFish: number;
  maxFish: number;
  schoolEnergy: number;
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

const fishMarker = (typeId: ActiveFishTypeId): HTMLDivElement => {
  const definition = fishTypes[typeId];
  const element = marker("fish-card-marker fish-card-sprite", "o");
  const sprite = getFishSprite(typeId);

  if (!sprite) {
    return element;
  }

  const image = document.createElement("img");
  image.src = sprite.src;
  image.alt = definition.label;
  element.replaceChildren(image);
  return element;
};

const small = (text: string): HTMLParagraphElement => {
  const element = note(text);
  element.className = "small-note";
  return element;
};

const feedbackNotes = (run: RunState): HTMLParagraphElement[] => {
  const message = run.lastRecoverySummary || run.lastRecruitmentSummary;

  return message ? [small(message)] : [];
};

const totalFishCounts = (fishCounts: RunState["fishCounts"]): number =>
  Object.values(fishCounts).reduce((sum, count) => sum + (count ?? 0), 0);

export const saveSummaryText = (run: RunState): string[] => [
  `Level ${run.level}`,
  `Best ${run.bestLevel}`,
  `School ${run.fishCount}/${run.maxFishCount}`,
  `Shells ${run.currency}`,
];

export const gameOverSummaryText = (summary: Pick<GameOverHandlers, "bestLevel" | "finalFish" | "maxFish" | "schoolEnergy">): string[] => [
  `Reached L${summary.bestLevel}`,
  `School ${summary.finalFish}/${summary.maxFish}`,
  `Energy ${Math.round(summary.schoolEnergy)}`,
];

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
    overlay.replaceChildren(
      title("Recruit a Fish"),
      small("Pick a role. The new fish joins the school for the next fight."),
      ...feedbackNotes(handlers.run),
      card(
        "choice-grid recruit-choice-grid",
        recruitmentChoices.map((option) => {
          const definition = fishTypes[option.id];
          const affordable = handlers.run.currency >= option.shellCost;
          const costText = option.shellCost === 0 ? "Free" : `${option.shellCost} Shells`;
          const lockedText = `Need ${option.shellCost - handlers.run.currency} Shells`;

          return card(`choice-card recruit-choice-card${affordable ? "" : " locked"}`, [
            fishMarker(option.id),
            note(definition.label),
            small(costText),
            small(definition.role),
            small(definition.description),
            small(definition.mechanics),
            small(`Add ${formatFishCountSummary(option.fishCounts)}`),
            button(affordable ? "Add to School" : lockedText, () => handlers.onChoose(option.id), !affordable),
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
      ...feedbackNotes(handlers.run),
      card(
        "choice-grid artifact-choice-grid",
        choices.map((artifact) => {
          const chooseArtifact = () => handlers.onChoose(artifact.id as ArtifactId);
          return clickableCard("choice-card clickable-choice-card", [
            marker("artifact-card-marker", "*"),
            note(artifact.name),
            small(artifact.rarity),
            small(artifact.effect),
            small(artifact.buildTags.slice(0, 2).map((tag) => artifactBuildTagLabels[tag]).join(" / ")),
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
      ...feedbackNotes(handlers.run),
      button("Continue", handlers.onContinue),
      button("Home", handlers.onHome),
      button("End Run", handlers.onEndRun),
    );
    return;
  }

  const missingFish = Math.max(0, handlers.run.maxFishCount - handlers.run.fishCount);
  const recoverableFish = Math.max(missingFish, totalFishCounts(handlers.run.lostFishCounts));
  const canKelp = handlers.run.currency >= 100 && recoverableFish > 0;
  const canInvest = handlers.run.currency >= 100 && handlers.run.invested === 0;

  overlay.replaceChildren(
    title("Break"),
    note(`Fish ${handlers.run.fishCount}/${handlers.run.maxFishCount}`),
    ...feedbackNotes(handlers.run),
    card("choice-grid small-choice-grid", [
      card("choice-card", [
        marker("fish-card-marker", "o"),
        note("Feed Kelp"),
        small("100 Shells"),
        small(`Recover up to ${Math.min(5, recoverableFish)} fish`),
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
    ...saveSummaryText(handlers.run).map(note),
    button("Back", handlers.onBack),
  );
};

export const renderGameOver = (overlay: HTMLElement, handlers: GameOverHandlers): void => {
  overlay.className = "overlay menu compact";
  overlay.replaceChildren(
    title("Run Ended"),
    ...gameOverSummaryText(handlers).map(note),
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
