import { PUZZLES } from "@/data/puzzles";
import { ComposablePuzzle } from "@/types/puzzle";
import { loadProgress } from "./player-progress";

const RECENT_HISTORY_LIMIT = 15;

type SmartRandomOptions =
  | string
  | {
      type?: string;
      excludeIndexes?: number[];
    };

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

export async function smartRandomPuzzleIndex(
  options?: SmartRandomOptions
): Promise<number> {
  if (!PUZZLES.length) {
    return 0;
  }

  const progress = await loadProgress();

  const type =
    typeof options === "string"
      ? options
      : options?.type;

  const externalExcludes =
    typeof options === "object"
      ? options.excludeIndexes || []
      : [];

  const recent = [
    ...(progress.recentPuzzleIndexes || []),
    ...externalExcludes,
  ].slice(-RECENT_HISTORY_LIMIT);

  const indexed = PUZZLES.map((puzzle, index) => ({
    puzzle,
    index,
  }));

  let pool = type
    ? indexed.filter(({ puzzle }) => {
        return (puzzle.game_type || "find_anomaly") === type;
      })
    : indexed;

  if (!pool.length) {
    return 0;
  }

  const filtered = pool.filter(({ index }) => !recent.includes(index));

  if (filtered.length) {
    pool = filtered;
  }

  const random = pool[Math.floor(Math.random() * pool.length)];

  return random.index;
}

export async function randomPuzzle(): Promise<ComposablePuzzle> {
  const index = await smartRandomPuzzleIndex();

  return PUZZLES[index];
}

export async function randomPuzzleByType(
  type: string
): Promise<ComposablePuzzle> {
  const index = await smartRandomPuzzleIndex(type);

  return PUZZLES[index];
}
