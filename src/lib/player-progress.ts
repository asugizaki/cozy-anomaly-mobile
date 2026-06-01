import AsyncStorage from "@react-native-async-storage/async-storage";
import { levelForXp } from "./progression";

const STARTER_AVATAR_ID = "tanuki";

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

  skillPoints: number;
  spentSkillPoints: number;
  unlockedSkillNodeIds: string[];

  lootBoxes: number;
  lootBoxesOpened: number;

  currentAvatarId: string;
  unlockedAvatarIds: string[];

  unlockedTitleIds: string[];
  equippedTitleId?: string;

  claimedCollectionRewardIds: string[];
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

  skillPoints: 0,
  spentSkillPoints: 0,
  unlockedSkillNodeIds: [],

  lootBoxes: 0,
  lootBoxesOpened: 0,

  currentAvatarId: STARTER_AVATAR_ID,
  unlockedAvatarIds: [STARTER_AVATAR_ID],

  unlockedTitleIds: ["rookie_observer"],
  equippedTitleId: "rookie_observer",

  claimedCollectionRewardIds: [],
};

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw);
    const xp = Number(parsed.xp || 0);

    const unlockedAvatarIds = safeArray(parsed.unlockedAvatarIds);
    if (!unlockedAvatarIds.includes(STARTER_AVATAR_ID)) {
      unlockedAvatarIds.push(STARTER_AVATAR_ID);
    }

    const unlockedTitleIds = safeArray(parsed.unlockedTitleIds);
    if (!unlockedTitleIds.includes("rookie_observer")) {
      unlockedTitleIds.push("rookie_observer");
    }

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,

      completedPuzzleIds: safeArray(parsed.completedPuzzleIds),
      favoritePuzzleIds: safeArray(parsed.favoritePuzzleIds),
      recentPlayedPuzzleIds: safeArray(parsed.recentPlayedPuzzleIds),
      completedDailyKeys: safeArray(parsed.completedDailyKeys),
      recentPuzzleIndexes: Array.isArray(parsed.recentPuzzleIndexes)
        ? parsed.recentPuzzleIndexes.filter((item: unknown) => typeof item === "number")
        : [],

      xp,
      level: levelForXp(xp),
      coins: Number(parsed.coins || 0),
      lifetimeCoins: Number(parsed.lifetimeCoins || parsed.coins || 0),

      skillPoints: Number(parsed.skillPoints || 0),
      spentSkillPoints: Number(parsed.spentSkillPoints || 0),
      unlockedSkillNodeIds: safeArray(parsed.unlockedSkillNodeIds),

      lootBoxes: Number(parsed.lootBoxes || 0),
      lootBoxesOpened: Number(parsed.lootBoxesOpened || 0),

      currentAvatarId: parsed.currentAvatarId || STARTER_AVATAR_ID,
      unlockedAvatarIds,

      unlockedTitleIds,
      equippedTitleId: parsed.equippedTitleId || "rookie_observer",

      claimedCollectionRewardIds: safeArray(parsed.claimedCollectionRewardIds),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: PlayerProgress) {
  const unlockedAvatarIds = progress.unlockedAvatarIds || [STARTER_AVATAR_ID];

  if (!unlockedAvatarIds.includes(STARTER_AVATAR_ID)) {
    unlockedAvatarIds.push(STARTER_AVATAR_ID);
  }

  const unlockedTitleIds = progress.unlockedTitleIds || ["rookie_observer"];

  if (!unlockedTitleIds.includes("rookie_observer")) {
    unlockedTitleIds.push("rookie_observer");
  }

  const normalized: PlayerProgress = {
    ...DEFAULT_PROGRESS,
    ...progress,
    level: levelForXp(progress.xp || 0),
    currentAvatarId: progress.currentAvatarId || STARTER_AVATAR_ID,
    unlockedAvatarIds,
    unlockedTitleIds,
    equippedTitleId: progress.equippedTitleId || "rookie_observer",
    claimedCollectionRewardIds: progress.claimedCollectionRewardIds || [],
  };

  await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
}
