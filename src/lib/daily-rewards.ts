import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadProgress, saveProgress } from "./player-progress";
import { trackAnalyticsEvent } from "./analytics";

const DAILY_REWARD_KEY = "daily_reward_state_v1";

export type DailyRewardState = {
  lastClaimedDate?: string;
  streakDay: number;
  claimedDates: string[];
};

export type DailyReward = {
  day: number;
  label: string;
  coins: number;
  energy: number;
  lootBoxes: number;
};

export const DAILY_REWARD_TRACK: DailyReward[] = [
  { day: 1, label: "Welcome Back", coins: 10, energy: 1, lootBoxes: 0 },
  { day: 2, label: "Town Helper", coins: 15, energy: 1, lootBoxes: 0 },
  { day: 3, label: "Cafe Friend", coins: 20, energy: 2, lootBoxes: 0 },
  { day: 4, label: "Sharp Eyes", coins: 25, energy: 2, lootBoxes: 0 },
  { day: 5, label: "Restoration Buddy", coins: 30, energy: 3, lootBoxes: 0 },
  { day: 6, label: "Pon’s Favorite", coins: 40, energy: 3, lootBoxes: 0 },
  { day: 7, label: "Weekly Gift", coins: 50, energy: 5, lootBoxes: 1 },
];

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function yesterdayKey(date = new Date()) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);

  return todayKey(copy);
}

function normalizeState(state?: Partial<DailyRewardState>): DailyRewardState {
  return {
    lastClaimedDate: state?.lastClaimedDate,
    streakDay: Math.max(0, Number(state?.streakDay || 0)),
    claimedDates: Array.isArray(state?.claimedDates) ? state.claimedDates : [],
  };
}

export async function loadDailyRewardState() {
  try {
    const raw = await AsyncStorage.getItem(DAILY_REWARD_KEY);

    if (!raw) return normalizeState();

    return normalizeState(JSON.parse(raw));
  } catch {
    return normalizeState();
  }
}

async function saveDailyRewardState(state: DailyRewardState) {
  await AsyncStorage.setItem(DAILY_REWARD_KEY, JSON.stringify(state));
}

export function dailyRewardForDay(day: number) {
  return DAILY_REWARD_TRACK[(Math.max(1, day) - 1) % DAILY_REWARD_TRACK.length];
}

export function nextDailyRewardState(current: DailyRewardState) {
  const today = todayKey();

  if (current.lastClaimedDate === today) {
    return {
      canClaim: false,
      nextStreakDay: current.streakDay || 1,
      reward: dailyRewardForDay(current.streakDay || 1),
    };
  }

  const isContinuing = current.lastClaimedDate === yesterdayKey();
  const nextStreakDay = isContinuing ? (current.streakDay || 0) + 1 : 1;

  return {
    canClaim: true,
    nextStreakDay,
    reward: dailyRewardForDay(nextStreakDay),
  };
}

export async function claimDailyReward() {
  const state = await loadDailyRewardState();
  const claim = nextDailyRewardState(state);

  if (!claim.canClaim) {
    return {
      success: false,
      state,
      reward: claim.reward,
      message: "Daily reward already claimed.",
    };
  }

  const today = todayKey();
  const progress = await loadProgress();
  const reward = claim.reward;

  const updatedProgress = {
    ...progress,
    coins: (progress.coins || 0) + reward.coins,
    lifetimeCoins: (progress.lifetimeCoins || 0) + reward.coins,
    energy: (progress.energy || 0) + reward.energy,
    lootBoxes: (progress.lootBoxes || 0) + reward.lootBoxes,
    lastEnergyAt:
      (progress.energy || 0) + reward.energy >= (progress.maxEnergy || 20)
        ? Date.now()
        : progress.lastEnergyAt,
  };

  await saveProgress(updatedProgress);

  const updatedState: DailyRewardState = {
    lastClaimedDate: today,
    streakDay: claim.nextStreakDay,
    claimedDates: Array.from(new Set([...(state.claimedDates || []), today])).slice(-60),
  };

  await saveDailyRewardState(updatedState);

  trackAnalyticsEvent("daily_reward_claimed" as any, {
    streakDay: claim.nextStreakDay,
    coins: reward.coins,
    energy: reward.energy,
    lootBoxes: reward.lootBoxes,
  });

  return {
    success: true,
    state: updatedState,
    reward,
    progress: updatedProgress,
    message: "Daily reward claimed.",
  };
}

export async function resetDailyRewardForTesting() {
  await AsyncStorage.removeItem(DAILY_REWARD_KEY);
}
