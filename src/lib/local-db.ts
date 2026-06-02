import * as SQLite from "expo-sqlite";

const DB_NAME = "cozy-anomaly.db";
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function openLocalDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }

  return dbPromise;
}

export async function initLocalDb() {
  const db = await openLocalDb();

  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS puzzles (
      id TEXT PRIMARY KEY NOT NULL,
      puzzle_index INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      game_type TEXT NOT NULL,
      collection TEXT,
      category TEXT,
      asset TEXT,
      scene TEXT,
      search_text TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_puzzles_index ON puzzles(puzzle_index);
    CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty ON puzzles(difficulty);
    CREATE INDEX IF NOT EXISTS idx_puzzles_game_type ON puzzles(game_type);
    CREATE INDEX IF NOT EXISTS idx_puzzles_collection ON puzzles(collection);
    CREATE INDEX IF NOT EXISTS idx_puzzles_asset ON puzzles(asset);
  `);

  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES ('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    String(SCHEMA_VERSION)
  );

  return db;
}

export async function getMetaValue(key: string) {
  const db = await initLocalDb();

  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?",
    key
  );

  return row?.value;
}

export async function setMetaValue(key: string, value: string) {
  const db = await initLocalDb();

  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    key,
    value
  );
}
