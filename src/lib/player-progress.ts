import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlayerProgress = {
  completedPuzzleIds: string[];
  currentStreak: number;
  bestStreak: number;
  totalSolved: number;
  hintsUsed: number;
  totalWrongTaps: number;
  perfectGames: number;
  dailyChallengesCompleted: number;
  completedDailyKeys: string[];
  lastPuzzleIndex: number;
  recentPuzzleIndexes: number[];
};

const KEY = "player_progress";

export const DEFAULT_PROGRESS: PlayerProgress = {
  completedPuzzleIds: [],
  currentStreak: 0,
  bestStreak: 0,
  totalSolved: 0,
  hintsUsed: 0,
  totalWrongTaps: 0,
  perfectGames: 0,
  dailyChallengesCompleted: 0,
  completedDailyKeys: [],
  lastPuzzleIndex: 0,
  recentPuzzleIndexes: [],
};

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedPuzzleIds: Array.isArray(parsed.completedPuzzleIds)
        ? parsed.completedPuzzleIds
        : [],
      completedDailyKeys: Array.isArray(parsed.completedDailyKeys)
        ? parsed.completedDailyKeys
        : [],
      recentPuzzleIndexes: Array.isArray(parsed.recentPuzzleIndexes)
        ? parsed.recentPuzzleIndexes
        : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: PlayerProgress) {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}
