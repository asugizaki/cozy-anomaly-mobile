import { PUZZLES } from "@/data/puzzles";
import {
  nextCollectionPuzzle,
  puzzleCollectionId,
  puzzlesForCollection,
  unsolvedPuzzlesForCollection,
} from "@/lib/collections";
import { ComposablePuzzle } from "@/types/puzzle";
import { loadProgress, PlayerProgress } from "./player-progress";
import { randomPuzzleIndexFromDb } from "./puzzle-db";

const RECENT_HISTORY_LIMIT = 15;

type SmartRandomOptions =
  | string
  | {
      type?: string;
      difficulty?: "easy" | "medium" | "hard";
      collection?: string;
      favoritesOnly?: boolean;
      unsolvedOnly?: boolean;
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

export function puzzleIndexById(puzzleId: string): number {
  const index = PUZZLES.findIndex((puzzle) => puzzle.id === puzzleId);
  return safePuzzleIndex(index);
}

export function puzzleById(puzzleId: string): ComposablePuzzle | undefined {
  return PUZZLES.find((puzzle) => puzzle.id === puzzleId);
}

export function puzzlesByIds(puzzleIds: string[]): ComposablePuzzle[] {
  const byId = new Map(PUZZLES.map((puzzle) => [puzzle.id, puzzle]));

  return puzzleIds
    .map((id) => byId.get(id))
    .filter((puzzle): puzzle is ComposablePuzzle => Boolean(puzzle));
}

function filteredPool(
  progress: PlayerProgress,
  options?: SmartRandomOptions
) {
  const type = typeof options === "string" ? options : options?.type;
  const difficulty =
    typeof options === "object" ? options.difficulty : undefined;
  const collection =
    typeof options === "object" ? options.collection : undefined;
  const favoritesOnly =
    typeof options === "object" ? options.favoritesOnly : false;
  const unsolvedOnly =
    typeof options === "object" ? options.unsolvedOnly : false;

  const favoriteIds = new Set(progress.favoritePuzzleIds || []);
  const completedIds = new Set(progress.completedPuzzleIds || []);

  let pool = PUZZLES.map((puzzle, index) => ({
    puzzle,
    index,
  }));

  if (type) {
    pool = pool.filter(({ puzzle }) => {
      return (puzzle.game_type || "find_anomaly") === type;
    });
  }

  if (difficulty) {
    pool = pool.filter(({ puzzle }) => puzzle.difficulty === difficulty);
  }

  if (collection) {
    pool = pool.filter(({ puzzle }) => {
      return puzzleCollectionId(puzzle) === collection;
    });
  }

  if (favoritesOnly) {
    pool = pool.filter(({ puzzle }) => favoriteIds.has(puzzle.id));
  }

  if (unsolvedOnly) {
    pool = pool.filter(({ puzzle }) => !completedIds.has(puzzle.id));
  }

  return pool;
}

export async function smartRandomPuzzleIndex(
  options?: SmartRandomOptions
): Promise<number> {
  if (!PUZZLES.length) {
    return 0;
  }

  const progress = await loadProgress();
  const externalExcludes =
    typeof options === "object" ? options.excludeIndexes || [] : [];

  const recent = [
    ...(progress.recentPuzzleIndexes || []),
    ...externalExcludes,
  ].slice(-RECENT_HISTORY_LIMIT);

  const type = typeof options === "string" ? options : options?.type;
  const difficulty =
    typeof options === "object" ? options.difficulty : undefined;
  const collection =
    typeof options === "object" ? options.collection : undefined;
  const unsolvedOnly =
    typeof options === "object" ? options.unsolvedOnly : false;
  const favoritesOnly =
    typeof options === "object" ? options.favoritesOnly : false;

  // DB-backed random selection is the scalable path. Keep the in-memory fallback
  // for favorites because favorites are currently stored in AsyncStorage.
  if (!favoritesOnly) {
    try {
      const dbIndex = await randomPuzzleIndexFromDb({
        type,
        difficulty,
        collection,
        excludeIndexes: recent,
        excludeIds: unsolvedOnly ? progress.completedPuzzleIds || [] : [],
      });

      if (typeof dbIndex === "number") {
        return safePuzzleIndex(dbIndex);
      }

      if (unsolvedOnly) {
        const fallbackDbIndex = await randomPuzzleIndexFromDb({
          type,
          difficulty,
          collection,
          excludeIndexes: recent,
        });

        if (typeof fallbackDbIndex === "number") {
          return safePuzzleIndex(fallbackDbIndex);
        }
      }
    } catch {
      // Fall back to the original in-memory path if SQLite is unavailable during
      // development or before dependencies are installed.
    }
  }

  let pool = filteredPool(progress, options);

  if (!pool.length && typeof options === "object" && options.unsolvedOnly) {
    pool = filteredPool(progress, {
      ...options,
      unsolvedOnly: false,
    });
  }

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


export async function nextCollectionPuzzleIndex(collectionId: string) {
  const progress = await loadProgress();
  const puzzle = nextCollectionPuzzle(collectionId, progress);

  if (!puzzle) {
    return 0;
  }

  return puzzleIndexById(puzzle.id);
}

export async function randomCollectionPuzzleIndex(collectionId: string) {
  return smartRandomPuzzleIndex({
    collection: collectionId,
  });
}

export async function unsolvedCollectionPuzzleIndex(collectionId: string) {
  return smartRandomPuzzleIndex({
    collection: collectionId,
    unsolvedOnly: true,
  });
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

export function collectionHasUnsolved(
  collectionId: string,
  progress: PlayerProgress
) {
  return unsolvedPuzzlesForCollection(collectionId, progress).length > 0;
}

export function collectionTotal(collectionId: string) {
  return puzzlesForCollection(collectionId).length;
}
