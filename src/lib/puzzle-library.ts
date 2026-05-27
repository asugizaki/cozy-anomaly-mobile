import { PUZZLES } from "@/data/puzzles";
import { ComposablePuzzle } from "@/types/puzzle";
import { loadProgress } from "./player-progress";

export function allPuzzles(): ComposablePuzzle[] {
  return PUZZLES;
}

export function safePuzzleIndex(index: number): number {
  if (!PUZZLES.length) return 0;
  if (!Number.isFinite(index)) return 0;
  if (index < 0) return 0;
  if (index >= PUZZLES.length) return 0;
  return index;
}

export async function smartRandomPuzzleIndex(type?: string): Promise<number> {
  const progress = await loadProgress();
  const recent = progress.recentPuzzleIndexes || [];

  const indexed = PUZZLES.map((puzzle, index) => ({ puzzle, index }));

  let pool = type
    ? indexed.filter(({ puzzle }) => {
        return (puzzle.game_type || "find_anomaly") === type;
      })
    : indexed;

  const filtered = pool.filter(({ index }) => !recent.includes(index));

  if (filtered.length) {
    pool = filtered;
  }

  if (!pool.length) return 0;

  return pool[Math.floor(Math.random() * pool.length)].index;
}