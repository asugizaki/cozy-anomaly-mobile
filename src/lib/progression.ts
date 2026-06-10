import { ComposablePuzzle } from "@/types/puzzle";
import { PlayerProgress } from "./player-progress";
import { levelForXp } from "./levels";
import { ECONOMY_CONFIG } from "./economy-config";
import { coinMultiplier, hasSkill, xpMultiplier } from "./skill-tree";

export type PuzzleReward = {
  xp: number;
  coins: number;
  lootBoxes: number;
  skillPoints: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  reasons: string[];
};

const BASE_XP_BY_DIFFICULTY: Record<string, number> = ECONOMY_CONFIG.puzzleRewards.xpByDifficulty;

const BASE_COINS_BY_DIFFICULTY: Record<string, number> = ECONOMY_CONFIG.puzzleRewards.coinsByDifficulty;

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

  const levelBefore = levelForXp(progress.xp || 0);

  if (wasFailed) {
    return {
      xp: 0,
      coins: 0,
      lootBoxes: 0,
      skillPoints: 0,
      levelBefore,
      levelAfter: levelBefore,
      leveledUp: false,
      reasons: ["No reward on reveal"],
    };
  }

  let xp = BASE_XP_BY_DIFFICULTY[puzzle.difficulty] || 20;
  let coins = BASE_COINS_BY_DIFFICULTY[puzzle.difficulty] || 10;
  let lootBoxes = 0;

  const reasons = [`${puzzle.difficulty.toUpperCase()} clear`];

  if (isPerfect) {
    xp += ECONOMY_CONFIG.puzzleRewards.perfectBonusXp;
    coins += ECONOMY_CONFIG.puzzleRewards.perfectBonusCoins;
    reasons.push("Perfect bonus");

    if (hasSkill(progress, "perfect_bonus_1")) {
      coins += ECONOMY_CONFIG.skills.perfectBonusCoins;
      reasons.push("Perfect Eye");
    }
  }

  if (usedNoHints) {
    xp += ECONOMY_CONFIG.puzzleRewards.noHintBonusXp;
    reasons.push("No-hint bonus");
  }

  if (isDailyMode) {
    xp += ECONOMY_CONFIG.puzzleRewards.dailyBonusXp;
    coins += ECONOMY_CONFIG.puzzleRewards.dailyBonusCoins;
    reasons.push("Daily bonus");

    if (hasSkill(progress, "daily_bonus_1")) {
      xp += ECONOMY_CONFIG.skills.dailyBonusXp;
      reasons.push("Daily Focus");
    }
  }

  if (completedCollection) {
    xp += ECONOMY_CONFIG.puzzleRewards.collectionCompleteXp;
    coins += ECONOMY_CONFIG.puzzleRewards.collectionCompleteCoins;
    lootBoxes += ECONOMY_CONFIG.puzzleRewards.collectionCompleteLootBoxes;
    reasons.push("Collection complete crate");
  }

  if (alreadyCompleted) {
    xp = Math.max(1, Math.floor(xp * ECONOMY_CONFIG.puzzleRewards.replayMultiplier));
    coins = Math.max(1, Math.floor(coins * ECONOMY_CONFIG.puzzleRewards.replayMultiplier));
    reasons.push("Replay reward");
  }

  xp = Math.max(1, Math.round(xp * xpMultiplier(progress)));
  coins = Math.max(1, Math.round(coins * coinMultiplier(progress)));

  const afterXp = (progress.xp || 0) + xp;
  const levelAfter = levelForXp(afterXp);
  const skillPoints = Math.max(0, levelAfter - levelBefore);

  if (skillPoints > 0) {
    reasons.push(`+${skillPoints} skill point${skillPoints === 1 ? "" : "s"}`);
  }

  return {
    xp,
    coins,
    lootBoxes,
    skillPoints,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
    reasons,
  };
}
