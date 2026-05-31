import { PUZZLES } from "@/data/puzzles";
import { ComposablePuzzle } from "@/types/puzzle";
import { PlayerProgress } from "./player-progress";

export type CollectionSummary = {
  id: string;
  label: string;
  emoji: string;
  total: number;
  completed: number;
  remaining: number;
  progress: number;
  nextPuzzleId?: string;
};

const COLLECTION_META: Record<string, { label: string; emoji: string }> = {
  general: { label: "General", emoji: "✨" },
  cozy_cafe: { label: "Cozy Cafe", emoji: "☕" },
  cafe: { label: "Cafe", emoji: "☕" },
  food: { label: "Food", emoji: "🍜" },
  tanuki: { label: "Tanuki", emoji: "🦝" },
  daruma: { label: "Daruma", emoji: "🔴" },
  holiday: { label: "Holiday", emoji: "🎄" },
  animals: { label: "Animals", emoji: "🐾" },
  japanese: { label: "Japanese", emoji: "🏮" },
};

function normalizeId(value?: string) {
  return (
    (value || "general")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "general"
  );
}

export function puzzleCollectionId(puzzle: ComposablePuzzle): string {
  return normalizeId(
    puzzle.collection || puzzle.category || puzzle.asset || "general"
  );
}

export function collectionLabel(id: string): string {
  if (COLLECTION_META[id]) return COLLECTION_META[id].label;

  return id
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function collectionEmoji(id: string): string {
  return COLLECTION_META[id]?.emoji || "📦";
}

export function collectionCompletionPercent(
  completed: number,
  total: number
) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function collectionRemaining(completed: number, total: number) {
  return Math.max(0, total - completed);
}

export function puzzlesForCollection(collectionId: string) {
  return PUZZLES.filter(
    (puzzle) => puzzleCollectionId(puzzle) === collectionId
  );
}

export function unsolvedPuzzlesForCollection(
  collectionId: string,
  progress: PlayerProgress
) {
  const completed = new Set(progress.completedPuzzleIds || []);

  return puzzlesForCollection(collectionId).filter(
    (puzzle) => !completed.has(puzzle.id)
  );
}

export function completedPuzzlesForCollection(
  collectionId: string,
  progress: PlayerProgress
) {
  const completed = new Set(progress.completedPuzzleIds || []);

  return puzzlesForCollection(collectionId).filter((puzzle) =>
    completed.has(puzzle.id)
  );
}

export function nextCollectionPuzzle(
  collectionId: string,
  progress: PlayerProgress
): ComposablePuzzle | undefined {
  const unsolved = unsolvedPuzzlesForCollection(collectionId, progress);

  if (unsolved.length) {
    return unsolved[0];
  }

  return puzzlesForCollection(collectionId)[0];
}

export function collectionSummary(
  progress: PlayerProgress
): CollectionSummary[] {
  const completed = new Set(progress.completedPuzzleIds || []);
  const map = new Map<string, CollectionSummary>();

  PUZZLES.forEach((puzzle) => {
    const id = puzzleCollectionId(puzzle);

    if (!map.has(id)) {
      map.set(id, {
        id,
        label: collectionLabel(id),
        emoji: collectionEmoji(id),
        total: 0,
        completed: 0,
        remaining: 0,
        progress: 0,
      });
    }

    const summary = map.get(id)!;
    summary.total += 1;

    if (completed.has(puzzle.id)) {
      summary.completed += 1;
    }
  });

  return [...map.values()]
    .map((summary) => {
      const nextPuzzle = nextCollectionPuzzle(summary.id, progress);

      return {
        ...summary,
        remaining: collectionRemaining(summary.completed, summary.total),
        progress: summary.total ? summary.completed / summary.total : 0,
        nextPuzzleId: nextPuzzle?.id,
      };
    })
    .sort((a, b) => {
      if (a.progress !== b.progress) return b.progress - a.progress;
      return a.label.localeCompare(b.label);
    });
}

export function closestIncompleteCollection(
  progress: PlayerProgress
): CollectionSummary | undefined {
  return collectionSummary(progress)
    .filter((collection) => collection.remaining > 0)
    .sort((a, b) => {
      if (a.progress !== b.progress) return b.progress - a.progress;
      return a.remaining - b.remaining;
    })[0];
}
