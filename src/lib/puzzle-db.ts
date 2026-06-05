import { PUZZLES } from "@/data/puzzles";
import { puzzleCollectionId } from "@/lib/collections";
import { ComposablePuzzle } from "@/types/puzzle";
import { getMetaValue, initLocalDb } from "./local-db";

const PUZZLE_SEED_VERSION = `${PUZZLES.length}:${PUZZLES[0]?.id || "empty"}:${
  PUZZLES[PUZZLES.length - 1]?.id || "empty"
}`;

type PuzzleRow = {
  id: string;
  puzzle_index: number;
  difficulty: string;
  game_type: string;
  collection: string | null;
  category: string | null;
  asset: string | null;
  scene: string | null;
  search_text: string | null;
};

function puzzleSearchText(puzzle: ComposablePuzzle) {
  return [
    puzzle.id,
    puzzle.scene,
    puzzle.asset,
    puzzle.anomaly,
    puzzle.answer,
    puzzle.category,
    puzzle.collection,
    ...(puzzle.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export async function seedPuzzleDbIfNeeded() {
  const db = await initLocalDb();
  const currentSeedVersion = await getMetaValue("puzzle_seed_version");

  if (currentSeedVersion === PUZZLE_SEED_VERSION) {
    return {
      seeded: false,
      count: PUZZLES.length,
    };
  }

  await db.runAsync("DELETE FROM puzzles");

  for (let index = 0; index < PUZZLES.length; index += 1) {
    const puzzle = PUZZLES[index];

    await db.runAsync(
      `
        INSERT OR REPLACE INTO puzzles (
          id,
          puzzle_index,
          difficulty,
          game_type,
          collection,
          category,
          asset,
          scene,
          search_text,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      puzzle.id,
      index,
      puzzle.difficulty,
      puzzle.game_type || "find_anomaly",
      puzzleCollectionId(puzzle),
      puzzle.category || null,
      puzzle.asset || null,
      puzzle.scene || null,
      puzzleSearchText(puzzle),
      Date.now()
    );
  }

  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES ('puzzle_seed_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    PUZZLE_SEED_VERSION
  );

  return {
    seeded: true,
    count: PUZZLES.length,
  };
}

export async function puzzleCountFromDb() {
  const db = await initLocalDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM puzzles"
  );

  return row?.count || 0;
}

export async function randomPuzzleIndexFromDb(options?: {
  type?: string;
  difficulty?: "easy" | "medium" | "hard";
  collection?: string;
  excludeIndexes?: number[];
  excludeIds?: string[];
}) {
  await seedPuzzleDbIfNeeded();

  const db = await initLocalDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (options?.type) {
    where.push("game_type = ?");
    params.push(options.type);
  }

  if (options?.difficulty) {
    where.push("difficulty = ?");
    params.push(options.difficulty);
  }

  if (options?.collection) {
    where.push("collection = ?");
    params.push(options.collection);
  }

  if (options?.excludeIndexes?.length) {
    where.push(
      `puzzle_index NOT IN (${options.excludeIndexes.map(() => "?").join(",")})`
    );
    params.push(...options.excludeIndexes);
  }

  if (options?.excludeIds?.length) {
    where.push(`id NOT IN (${options.excludeIds.map(() => "?").join(",")})`);
    params.push(...options.excludeIds);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const row = await db.getFirstAsync<PuzzleRow>(
    `
      SELECT *
      FROM puzzles
      ${whereSql}
      ORDER BY RANDOM()
      LIMIT 1
    `,
    ...params
  );

  return typeof row?.puzzle_index === "number" ? row.puzzle_index : undefined;
}

export async function puzzleIndexesByCollectionFromDb(collectionId: string) {
  await seedPuzzleDbIfNeeded();

  const db = await initLocalDb();
  const rows = await db.getAllAsync<PuzzleRow>(
    `
      SELECT *
      FROM puzzles
      WHERE collection = ?
      ORDER BY puzzle_index ASC
    `,
    collectionId
  );

  return rows.map((row) => row.puzzle_index);
}
