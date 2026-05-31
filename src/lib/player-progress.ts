import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultAvatarId } from "./avatars";
import { levelForXp } from "./progression";

export type PlayerProgress = {
  completedPuzzleIds: string[];
  favoritePuzzleIds: string[];
  recentPlayedPuzzleIds: string[];
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

  xp: number;
  level: number;
  coins: number;
  lifetimeCoins: number;

  currentAvatarId: string;
  unlockedAvatarIds: string[];
};

const KEY = "player_progress";

export const DEFAULT_PROGRESS: PlayerProgress = {
  completedPuzzleIds: [],
  favoritePuzzleIds: [],
  recentPlayedPuzzleIds: [],
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

  xp: 0,
  level: 1,
  coins: 0,
  lifetimeCoins: 0,

  currentAvatarId: defaultAvatarId(),
  unlockedAvatarIds: [defaultAvatarId()],
};

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw);

    const xp = Number(parsed.xp || 0);
    const unlockedAvatarIds = Array.isArray(parsed.unlockedAvatarIds)
      ? parsed.unlockedAvatarIds
      : [defaultAvatarId()];

    if (!unlockedAvatarIds.includes(defaultAvatarId())) {
      unlockedAvatarIds.push(defaultAvatarId());
    }

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedPuzzleIds: Array.isArray(parsed.completedPuzzleIds)
        ? parsed.completedPuzzleIds
        : [],
      favoritePuzzleIds: Array.isArray(parsed.favoritePuzzleIds)
        ? parsed.favoritePuzzleIds
        : [],
      recentPlayedPuzzleIds: Array.isArray(parsed.recentPlayedPuzzleIds)
        ? parsed.recentPlayedPuzzleIds
        : [],
      completedDailyKeys: Array.isArray(parsed.completedDailyKeys)
        ? parsed.completedDailyKeys
        : [],
      recentPuzzleIndexes: Array.isArray(parsed.recentPuzzleIndexes)
        ? parsed.recentPuzzleIndexes
        : [],
      xp,
      level: levelForXp(xp),
      coins: Number(parsed.coins || 0),
      lifetimeCoins: Number(parsed.lifetimeCoins || parsed.coins || 0),
      currentAvatarId: parsed.currentAvatarId || defaultAvatarId(),
      unlockedAvatarIds,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: PlayerProgress) {
  const unlockedAvatarIds = progress.unlockedAvatarIds || [defaultAvatarId()];

  if (!unlockedAvatarIds.includes(defaultAvatarId())) {
    unlockedAvatarIds.push(defaultAvatarId());
  }

  const normalized: PlayerProgress = {
    ...DEFAULT_PROGRESS,
    ...progress,
    level: levelForXp(progress.xp || 0),
    currentAvatarId: progress.currentAvatarId || defaultAvatarId(),
    unlockedAvatarIds,
  };

  await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
}
