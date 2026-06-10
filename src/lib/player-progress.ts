import AsyncStorage from "@react-native-async-storage/async-storage";
import { levelForXp } from "./levels";

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
  claimedChapterRepairRewardIds: string[];
  bonusTanukiTickets: number;
  completedBonusTanukiIds: string[];

  energy: number;
  maxEnergy: number;
  lastEnergyAt: number;
  energyAdViewsToday: number;
  energyAdViewsDate: string;
  totalEnergySpent: number;
  totalEnergyFromAds: number;
  energySpentToday: number;
  adEnergyRefillsToday: number;

  dailyMissionDate: string;
  dailyMissionClaimedIds: string[];
  dailyStartTotalSolved: number;
  dailyStartPerfectGames: number;
  dailyStartHintsUsed: number;
  dailyStartTotalWrongTaps: number;

  activeEventId?: string;
  eventClaimedTaskIds: string[];
  eventStartTotalSolved: number;
  eventStartPerfectGames: number;
  eventStartHintsUsed: number;
  eventStartLootBoxesOpened: number;

  hasSeenPonIntro: boolean;
};

const KEY = "player_progress";
const STARTING_MAX_ENERGY = 20;

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
  claimedChapterRepairRewardIds: [],
  bonusTanukiTickets: 0,
  completedBonusTanukiIds: [],

  energy: STARTING_MAX_ENERGY,
  maxEnergy: STARTING_MAX_ENERGY,
  lastEnergyAt: Date.now(),
  energyAdViewsToday: 0,
  energyAdViewsDate: todayKey(),
  totalEnergySpent: 0,
  totalEnergyFromAds: 0,
  energySpentToday: 0,
  adEnergyRefillsToday: 0,

  dailyMissionDate: todayKey(),
  dailyMissionClaimedIds: [],
  dailyStartTotalSolved: 0,
  dailyStartPerfectGames: 0,
  dailyStartHintsUsed: 0,
  dailyStartTotalWrongTaps: 0,

  activeEventId: "cozy_kickoff",
  eventClaimedTaskIds: [],
  eventStartTotalSolved: 0,
  eventStartPerfectGames: 0,
  eventStartHintsUsed: 0,
  eventStartLootBoxesOpened: 0,

  hasSeenPonIntro: false,
};

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function resetDailyIfNeeded(progress: PlayerProgress): PlayerProgress {
  const today = todayKey();

  if (progress.dailyMissionDate === today && progress.energyAdViewsDate === today) {
    return progress;
  }

  return {
    ...progress,
    energyAdViewsToday:
      progress.energyAdViewsDate === today ? progress.energyAdViewsToday : 0,
    energyAdViewsDate: today,

    energySpentToday:
      progress.dailyMissionDate === today ? progress.energySpentToday : 0,
    adEnergyRefillsToday:
      progress.dailyMissionDate === today ? progress.adEnergyRefillsToday : 0,

    dailyMissionDate: today,
    dailyMissionClaimedIds:
      progress.dailyMissionDate === today ? progress.dailyMissionClaimedIds : [],
    dailyStartTotalSolved:
      progress.dailyMissionDate === today
        ? progress.dailyStartTotalSolved
        : progress.totalSolved,
    dailyStartPerfectGames:
      progress.dailyMissionDate === today
        ? progress.dailyStartPerfectGames
        : progress.perfectGames,
    dailyStartHintsUsed:
      progress.dailyMissionDate === today
        ? progress.dailyStartHintsUsed
        : progress.hintsUsed,
    dailyStartTotalWrongTaps:
      progress.dailyMissionDate === today
        ? progress.dailyStartTotalWrongTaps
        : progress.totalWrongTaps,
  };
}

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw);
    const xp = safeNumber(parsed.xp, 0);

    const unlockedAvatarIds = safeArray(parsed.unlockedAvatarIds);
    if (!unlockedAvatarIds.includes(STARTER_AVATAR_ID)) {
      unlockedAvatarIds.push(STARTER_AVATAR_ID);
    }

    const unlockedTitleIds = safeArray(parsed.unlockedTitleIds);
    if (!unlockedTitleIds.includes("rookie_observer")) {
      unlockedTitleIds.push("rookie_observer");
    }

    const progress: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,

      completedPuzzleIds: safeArray(parsed.completedPuzzleIds),
      favoritePuzzleIds: safeArray(parsed.favoritePuzzleIds),
      recentPlayedPuzzleIds: safeArray(parsed.recentPlayedPuzzleIds),
      completedDailyKeys: safeArray(parsed.completedDailyKeys),
      recentPuzzleIndexes: Array.isArray(parsed.recentPuzzleIndexes)
        ? parsed.recentPuzzleIndexes.filter(
            (item: unknown) => typeof item === "number"
          )
        : [],

      xp,
      level: levelForXp(xp),
      coins: safeNumber(parsed.coins, 0),
      lifetimeCoins: safeNumber(parsed.lifetimeCoins, parsed.coins || 0),

      skillPoints: safeNumber(parsed.skillPoints, 0),
      spentSkillPoints: safeNumber(parsed.spentSkillPoints, 0),
      unlockedSkillNodeIds: safeArray(parsed.unlockedSkillNodeIds),

      lootBoxes: safeNumber(parsed.lootBoxes, 0),
      lootBoxesOpened: safeNumber(parsed.lootBoxesOpened, 0),

      currentAvatarId: parsed.currentAvatarId || STARTER_AVATAR_ID,
      unlockedAvatarIds,

      unlockedTitleIds,
      equippedTitleId: parsed.equippedTitleId || "rookie_observer",

      claimedCollectionRewardIds: safeArray(parsed.claimedCollectionRewardIds),

      energy: safeNumber(parsed.energy, STARTING_MAX_ENERGY),
      maxEnergy: safeNumber(parsed.maxEnergy, STARTING_MAX_ENERGY),
      lastEnergyAt: safeNumber(parsed.lastEnergyAt, Date.now()),
      energyAdViewsToday: safeNumber(parsed.energyAdViewsToday, 0),
      energyAdViewsDate: parsed.energyAdViewsDate || todayKey(),
      totalEnergySpent: safeNumber(parsed.totalEnergySpent, 0),
      totalEnergyFromAds: safeNumber(parsed.totalEnergyFromAds, 0),
      energySpentToday: safeNumber(parsed.energySpentToday, 0),
      adEnergyRefillsToday: safeNumber(parsed.adEnergyRefillsToday, 0),

      dailyMissionDate: parsed.dailyMissionDate || todayKey(),
      dailyMissionClaimedIds: safeArray(parsed.dailyMissionClaimedIds),
      dailyStartTotalSolved: safeNumber(
        parsed.dailyStartTotalSolved,
        parsed.totalSolved || 0
      ),
      dailyStartPerfectGames: safeNumber(
        parsed.dailyStartPerfectGames,
        parsed.perfectGames || 0
      ),
      dailyStartHintsUsed: safeNumber(parsed.dailyStartHintsUsed, parsed.hintsUsed || 0),
      dailyStartTotalWrongTaps: safeNumber(
        parsed.dailyStartTotalWrongTaps,
        parsed.totalWrongTaps || 0
      ),

      activeEventId: parsed.activeEventId || "cozy_kickoff",
      eventClaimedTaskIds: safeArray(parsed.eventClaimedTaskIds),
      eventStartTotalSolved: safeNumber(
        parsed.eventStartTotalSolved,
        parsed.totalSolved || 0
      ),
      eventStartPerfectGames: safeNumber(
        parsed.eventStartPerfectGames,
        parsed.perfectGames || 0
      ),
      eventStartHintsUsed: safeNumber(parsed.eventStartHintsUsed, parsed.hintsUsed || 0),
      eventStartLootBoxesOpened: safeNumber(
        parsed.eventStartLootBoxesOpened,
        parsed.lootBoxesOpened || 0
      ),

      hasSeenPonIntro: Boolean(parsed.hasSeenPonIntro),
    };

    return resetDailyIfNeeded(progress);
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

  const normalized: PlayerProgress = resetDailyIfNeeded({
    ...DEFAULT_PROGRESS,
    ...progress,
    level: levelForXp(progress.xp || 0),
    currentAvatarId: progress.currentAvatarId || STARTER_AVATAR_ID,
    unlockedAvatarIds,
    unlockedTitleIds,
    equippedTitleId: progress.equippedTitleId || "rookie_observer",
    claimedCollectionRewardIds: progress.claimedCollectionRewardIds || [],
    maxEnergy: progress.maxEnergy || STARTING_MAX_ENERGY,
    lastEnergyAt: progress.lastEnergyAt || Date.now(),
  });

  await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
}
