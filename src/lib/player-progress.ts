import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlayerProgress = {
  completedPuzzleIds: string[];
  currentStreak: number;
  totalSolved: number;
  hintsUsed: number;
  lastPuzzleIndex: number;
  recentPuzzleIndexes: number[];
};

const KEY = "player_progress";

export const DEFAULT_PROGRESS: PlayerProgress = {
  completedPuzzleIds: [],
  currentStreak: 0,
  totalSolved: 0,
  hintsUsed: 0,
  lastPuzzleIndex: 0,
  recentPuzzleIndexes: [],
};

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROGRESS;

    return {
      ...DEFAULT_PROGRESS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: PlayerProgress) {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}