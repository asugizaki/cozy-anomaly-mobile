import { loadProgress, saveProgress } from "./player-progress";

export type TitleDefinition = {
  id: string;
  name: string;
  description: string;
};

export const TITLES: TitleDefinition[] = [
  {
    id: "rookie_observer",
    name: "Rookie Observer",
    description: "Starting title.",
  },
  {
    id: "sharp_eyes",
    name: "Sharp Eyes",
    description: "For players who notice tiny details.",
  },
  {
    id: "master_detective",
    name: "Master Detective",
    description: "A rare title from loot boxes.",
  },
  {
    id: "tanuki_whisperer",
    name: "Tanuki Whisperer",
    description: "A rare title for cozy collectors.",
  },
  {
    id: "perfect_spotter",
    name: "Perfect Spotter",
    description: "Awarded to players who keep perfecting puzzles.",
  },
];

export function titleById(id?: string) {
  return (
    TITLES.find((title) => title.id === id) ||
    TITLES.find((title) => title.id === "rookie_observer")!
  );
}

export async function equipTitle(titleId: string) {
  const progress = await loadProgress();

  if (!(progress.unlockedTitleIds || []).includes(titleId)) {
    return {
      success: false,
      message: "Unlock this title first.",
      progress,
    };
  }

  const updated = {
    ...progress,
    equippedTitleId: titleId,
  };

  await saveProgress(updated);

  return {
    success: true,
    message: "Title equipped.",
    progress: updated,
  };
}
