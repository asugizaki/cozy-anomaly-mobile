import { ComposablePuzzle } from "@/types/puzzle";
import { PlayerProgress } from "./player-progress";

export type PuzzleReward = {
  xp: number;
  coins: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  reasons: string[];
};

const BASE_XP_BY_DIFFICULTY: Record<string, number> = {
  easy: 10,
  medium: 20,
  hard: 40,
};

const BASE_COINS_BY_DIFFICULTY: Record<string, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
};

export function xpForLevel(level: number) {
  if (level <= 1) return 0;

  return Math.round(75 * Math.pow(level - 1, 1.45));
}

export function levelForXp(totalXp: number) {
  let level = 1;

  while (xpForLevel(level + 1) <= totalXp) {
    level += 1;
  }

  return level;
}

export function xpProgress(totalXp: number) {
  const level = levelForXp(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeeded,
    progress: xpNeeded ? xpIntoLevel / xpNeeded : 1,
  };
}

export function calculatePuzzleReward(options: {
  puzzle: ComposablePuzzle;
  progress: PlayerProgress;
  wasFailed: boolean;
  alreadyCompleted: boolean;
  isPerfect: boolean;
  usedNoHints: boolean;
  isDailyMode: boolean;
  completedCollection?: boolean;
}): PuzzleReward {
  const {
    puzzle,
    progress,
    wasFailed,
    alreadyCompleted,
    isPerfect,
    usedNoHints,
    isDailyMode,
    completedCollection,
  } = options;

  if (wasFailed) {
    const level = levelForXp(progress.xp || 0);

    return {
      xp: 0,
      coins: 0,
      levelBefore: level,
      levelAfter: level,
      leveledUp: false,
      reasons: ["No reward on reveal"],
    };
  }

  let xp = BASE_XP_BY_DIFFICULTY[puzzle.difficulty] || 20;
  let coins = BASE_COINS_BY_DIFFICULTY[puzzle.difficulty] || 10;
  const reasons = [`${puzzle.difficulty.toUpperCase()} clear`];

  if (isPerfect) {
    xp += 10;
    coins += 5;
    reasons.push("Perfect bonus");
  }

  if (usedNoHints) {
    xp += 5;
    reasons.push("No-hint bonus");
  }

  if (isDailyMode) {
    xp += 20;
    coins += 10;
    reasons.push("Daily bonus");
  }

  if (completedCollection) {
    xp += 50;
    coins += 25;
    reasons.push("Collection complete");
  }

  if (alreadyCompleted) {
    xp = Math.max(1, Math.floor(xp * 0.25));
    coins = Math.max(1, Math.floor(coins * 0.25));
    reasons.push("Replay reward");
  }

  const beforeXp = progress.xp || 0;
  const afterXp = beforeXp + xp;
  const levelBefore = levelForXp(beforeXp);
  const levelAfter = levelForXp(afterXp);

  return {
    xp,
    coins,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
    reasons,
  };
}
