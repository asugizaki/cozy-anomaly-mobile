import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();

const db = admin.firestore();

type PlayerProgress = {
  xp?: number;
  level?: number;
  coins?: number;
  lifetimeCoins?: number;

  energy?: number;
  maxEnergy?: number;
  lastEnergyAt?: number;
  energyAdViewsToday?: number;
  energyAdViewsDate?: string;
  totalEnergySpent?: number;
  totalEnergyFromAds?: number;
  energySpentToday?: number;
  adEnergyRefillsToday?: number;

  lootBoxes?: number;
  lootBoxesOpened?: number;

  skillPoints?: number;

  unlockedAvatarIds?: string[];
  currentAvatarId?: string;

  unlockedTitleIds?: string[];
  equippedTitleId?: string;

  dailyMissionClaimedIds?: string[];

  completedPuzzleIds?: string[];
  completedDailyKeys?: string[];

  recentPuzzleIndexes?: number[];
  recentPlayedPuzzleIds?: string[];

  claimedCollectionRewardIds?: string[];

  totalSolved?: number;
  currentStreak?: number;
  bestStreak?: number;

  perfectGames?: number;
  dailyChallengesCompleted?: number;

  hintsUsed?: number;
  totalWrongTaps?: number;

  unlockedSkillNodeIds?: string[];
  lastPuzzleIndex?: number;

  eventClaimedTaskIds?: string[];
  eventStartTotalSolved?: number;
  eventStartPerfectGames?: number;
  eventStartLootBoxesOpened?: number;
};

type MissionReward = {
  xp?: number;
  coins?: number;
  energy?: number;
  lootBoxes?: number;
};

type PuzzleCompletePayload = {
  progress?: PlayerProgress;
  puzzle: {
    id: string;
    difficulty: "easy" | "medium" | "hard";
    collection?: string;
  };
  puzzleIndex: number;
  wasFailed: boolean;
  alreadyCompleted: boolean;
  isPerfect: boolean;
  usedNoHints: boolean;
  isDailyMode: boolean;
  completedCollection: boolean;
  collectionRewardId?: string;
  dailyKey?: string;
};

type PuzzleReward = {
  xp: number;
  coins: number;
  lootBoxes: number;
  skillPoints: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  reasons: string[];
};


type LootboxReward =
  | {
      type: "coins";
      amount: number;
      label: string;
      emoji: string;
    }
  | {
      type: "avatar";
      avatarId: string;
      label: string;
      emoji: string;
    }
  | {
      type: "title";
      titleId: string;
      label: string;
      emoji: string;
    };

const DAILY_MISSION_REWARDS: Record<string, MissionReward> = {
  daily_solve_5: {
    xp: 60,
    coins: 80,
  },
  daily_perfect_1: {
    xp: 40,
    coins: 60,
  },
  daily_spend_energy_10: {
    coins: 100,
    energy: 3,
  },
  daily_ad_energy_1: {
    xp: 30,
    coins: 50,
  },
  daily_careful_play: {
    xp: 50,
    lootBoxes: 1,
  },
};


const EVENT_TASK_REWARDS: Record<string, MissionReward> = {
  event_solve_25: {
    xp: 250,
    coins: 300,
  },
  event_perfect_10: {
    coins: 500,
    lootBoxes: 1,
  },
  event_spend_energy_40: {
    xp: 300,
    energy: 10,
  },
  event_open_crates_3: {
    lootBoxes: 2,
    coins: 150,
  },
};

const AVATAR_REWARDS = [
  { id: "daruma", label: "Daruma", emoji: "🔴" },
  { id: "fox", label: "Kitsune", emoji: "🦊" },
  { id: "cat", label: "Lucky Cat", emoji: "🐱" },
  { id: "ramen", label: "Ramen Master", emoji: "🍜" },
  { id: "tea", label: "Tea Master", emoji: "🍵" },
  { id: "star", label: "Star Detective", emoji: "⭐" },
];

const TITLE_REWARDS = [
  { id: "sharp_eyes", label: "Sharp Eyes" },
  { id: "cozy_detective", label: "Cozy Detective" },
  { id: "anomaly_hunter", label: "Anomaly Hunter" },
  { id: "perfect_observer", label: "Perfect Observer" },
];

function requireUid(request: { auth?: { uid?: string } }) {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in is required.");
  }

  return uid;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function progressRef(userId: string) {
  return db.doc(`users/${userId}/private/progress`);
}

function economyRef(userId: string) {
  return db.doc(`users/${userId}/economy/balance`);
}

function claimRef(userId: string, claimId: string) {
  return db.doc(`mission_claims/${userId}_${claimId}`);
}

function transactionRef() {
  return db.collection("reward_transactions").doc();
}

function crateOpenRef() {
  return db.collection("crate_opens").doc();
}

function eventClaimRef(userId: string, claimId: string) {
  return db.doc(`event_claims/${userId}_${claimId}`);
}

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}


const SERVER_ENERGY_RECHARGE_MINUTES = 12;
const SERVER_AD_ENERGY_REWARD = 5;
const SERVER_MAX_DAILY_ENERGY_ADS = 3;

function applyServerEnergyRecharge(progress: PlayerProgress): PlayerProgress {
  const now = Date.now();
  const maxEnergy = safeNumber(progress.maxEnergy) || 20;
  const currentEnergy = safeNumber(progress.energy);

  if (currentEnergy >= maxEnergy) {
    return {
      ...progress,
      energy: maxEnergy,
      lastEnergyAt: now,
    };
  }

  const lastEnergyAt = safeNumber(progress.lastEnergyAt) || now;
  const elapsedMs = Math.max(0, now - lastEnergyAt);
  const rechargeMs = SERVER_ENERGY_RECHARGE_MINUTES * 60 * 1000;
  const gained = Math.floor(elapsedMs / rechargeMs);

  if (gained <= 0) {
    return progress;
  }

  const nextEnergy = Math.min(maxEnergy, currentEnergy + gained);
  const consumedMs = gained * rechargeMs;

  return {
    ...progress,
    energy: nextEnergy,
    lastEnergyAt: nextEnergy >= maxEnergy ? now : lastEnergyAt + consumedMs,
  };
}

function saveProgressAndEconomy(
  transaction: admin.firestore.Transaction,
  userId: string,
  progress: PlayerProgress,
  source: string
) {
  transaction.set(
    progressRef(userId),
    {
      schemaVersion: 1,
      userId,
      progress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deviceUpdatedAt: Date.now(),
      writeSource: source,
    },
    {
      merge: true,
    }
  );

  transaction.set(
    economyRef(userId),
    {
      userId,
      coins: progress.coins || 0,
      xp: progress.xp || 0,
      energy: progress.energy || 0,
      lootBoxes: progress.lootBoxes || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

function addRewardToProgress(
  progress: PlayerProgress,
  reward: MissionReward
): PlayerProgress {
  return {
    ...progress,
    xp: safeNumber(progress.xp) + safeNumber(reward.xp),
    coins: safeNumber(progress.coins) + safeNumber(reward.coins),
    lifetimeCoins:
      safeNumber(progress.lifetimeCoins) + safeNumber(reward.coins),
    energy: Math.min(
      safeNumber(progress.maxEnergy) || 20,
      safeNumber(progress.energy) + safeNumber(reward.energy)
    ),
    lootBoxes: safeNumber(progress.lootBoxes) + safeNumber(reward.lootBoxes),
  };
}


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

function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(75 * Math.pow(level - 1, 1.45));
}

function levelForXp(totalXp: number) {
  let level = 1;

  while (xpForLevel(level + 1) <= totalXp) {
    level += 1;
  }

  return level;
}

function hasSkill(progress: PlayerProgress, id: string) {
  return ((progress as any).unlockedSkillNodeIds || []).includes(id);
}

function xpMultiplier(progress: PlayerProgress) {
  if (hasSkill(progress, "xp_boost_2")) return 1.2;
  if (hasSkill(progress, "xp_boost_1")) return 1.1;
  return 1;
}

function coinMultiplier(progress: PlayerProgress) {
  if (hasSkill(progress, "coin_boost_2")) return 1.2;
  if (hasSkill(progress, "coin_boost_1")) return 1.1;
  return 1;
}

function calculateServerPuzzleReward(payload: PuzzleCompletePayload, progress: PlayerProgress): PuzzleReward {
  const levelBefore = levelForXp(safeNumber(progress.xp));

  if (payload.wasFailed) {
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

  // Production rule: no replay rewards. Completed puzzle IDs are server checked.
  if (payload.alreadyCompleted) {
    return {
      xp: 0,
      coins: 0,
      lootBoxes: 0,
      skillPoints: 0,
      levelBefore,
      levelAfter: levelBefore,
      leveledUp: false,
      reasons: ["Already completed"],
    };
  }

  let xp = BASE_XP_BY_DIFFICULTY[payload.puzzle.difficulty] || 20;
  let coins = BASE_COINS_BY_DIFFICULTY[payload.puzzle.difficulty] || 10;
  let lootBoxes = 0;

  const reasons = [`${payload.puzzle.difficulty.toUpperCase()} clear`];

  if (payload.isPerfect) {
    xp += 10;
    coins += 5;
    reasons.push("Perfect bonus");

    if (hasSkill(progress, "perfect_bonus_1")) {
      coins += 10;
      reasons.push("Perfect Eye");
    }
  }

  if (payload.usedNoHints) {
    xp += 5;
    reasons.push("No-hint bonus");
  }

  if (payload.isDailyMode) {
    xp += 20;
    coins += 10;
    reasons.push("Daily bonus");

    if (hasSkill(progress, "daily_bonus_1")) {
      xp += 10;
      reasons.push("Daily Focus");
    }
  }

  if (payload.completedCollection) {
    xp += 50;
    coins += 25;
    lootBoxes += 1;
    reasons.push("Collection complete crate");
  }

  xp = Math.max(1, Math.round(xp * xpMultiplier(progress)));
  coins = Math.max(1, Math.round(coins * coinMultiplier(progress)));

  const afterXp = safeNumber(progress.xp) + xp;
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

function addPuzzleRewardToProgress(
  progress: PlayerProgress,
  payload: PuzzleCompletePayload,
  reward: PuzzleReward
): PlayerProgress {
  const completedPuzzleIds = new Set(((progress as any).completedPuzzleIds || []) as string[]);
  completedPuzzleIds.add(payload.puzzle.id);

  const completedDailyKeys = new Set(((progress as any).completedDailyKeys || []) as string[]);
  if (payload.isDailyMode && payload.dailyKey) {
    completedDailyKeys.add(payload.dailyKey);
  }

  const recentIndexes = [
    ...((((progress as any).recentPuzzleIndexes || []) as number[])),
    payload.puzzleIndex,
  ].slice(-15);

  const recentPlayedPuzzleIds = [
    payload.puzzle.id,
    ...((((progress as any).recentPlayedPuzzleIds || []) as string[]).filter((id) => id !== payload.puzzle.id)),
  ].slice(0, 15);

  const claimedCollectionRewardIds = new Set(
    (((progress as any).claimedCollectionRewardIds || []) as string[])
  );

  if (payload.completedCollection && payload.collectionRewardId) {
    claimedCollectionRewardIds.add(payload.collectionRewardId);
  }

  const nextStreak = payload.wasFailed ? 0 : safeNumber((progress as any).currentStreak) + 1;

  return {
    ...progress,
    completedPuzzleIds: Array.from(completedPuzzleIds) as any,
    totalSolved: safeNumber((progress as any).totalSolved) + (payload.wasFailed ? 0 : 1),
    currentStreak: nextStreak as any,
    bestStreak: Math.max(safeNumber((progress as any).bestStreak), nextStreak) as any,
    perfectGames:
      safeNumber((progress as any).perfectGames) + (payload.isPerfect && !payload.wasFailed ? 1 : 0) as any,
    dailyChallengesCompleted:
      safeNumber((progress as any).dailyChallengesCompleted) +
      (payload.isDailyMode && !payload.wasFailed ? 1 : 0) as any,
    completedDailyKeys: Array.from(completedDailyKeys) as any,
    lastPuzzleIndex: payload.puzzleIndex as any,
    recentPuzzleIndexes: recentIndexes as any,
    recentPlayedPuzzleIds: recentPlayedPuzzleIds as any,
    xp: safeNumber(progress.xp) + reward.xp,
    level: reward.levelAfter,
    coins: safeNumber(progress.coins) + reward.coins,
    lifetimeCoins: safeNumber(progress.lifetimeCoins) + reward.coins,
    skillPoints: safeNumber(progress.skillPoints) + reward.skillPoints,
    lootBoxes: safeNumber(progress.lootBoxes) + reward.lootBoxes,
    claimedCollectionRewardIds: Array.from(claimedCollectionRewardIds) as any,
  };
}

function puzzleCompleteRef(userId: string, puzzleId: string) {
  return db.doc(`puzzle_completions/${userId}_${puzzleId.replace(/[\/#?[\\]]/g, "_")}`);
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function rollRarity() {
  const roll = Math.random();

  if (roll < 0.05) return "epic";
  if (roll < 0.3) return "rare";
  return "common";
}

function coinRewardForRarity(rarity: string) {
  if (rarity === "epic") return randomItem([300, 400, 500]);
  if (rarity === "rare") return randomItem([150, 200, 250]);
  return randomItem([50, 75, 100]);
}

function generateLootboxReward(progress: PlayerProgress, rarity: string): LootboxReward {
  const roll = Math.random();

  if (rarity === "epic" && roll < 0.45) {
    const unlocked = new Set(progress.unlockedAvatarIds || []);
    const eligible = AVATAR_REWARDS.filter((avatar) => !unlocked.has(avatar.id));

    if (eligible.length) {
      const avatar = randomItem(eligible);
      return {
        type: "avatar",
        avatarId: avatar.id,
        label: avatar.label,
        emoji: avatar.emoji,
      };
    }
  }

  if ((rarity === "epic" && roll < 0.75) || (rarity === "rare" && roll < 0.4)) {
    const unlocked = new Set(progress.unlockedTitleIds || []);
    const eligible = TITLE_REWARDS.filter((title) => !unlocked.has(title.id));

    if (eligible.length) {
      const title = randomItem(eligible);
      return {
        type: "title",
        titleId: title.id,
        label: title.label,
        emoji: "🏆",
      };
    }
  }

  const amount = coinRewardForRarity(rarity);

  return {
    type: "coins",
    amount,
    label: `${amount} coins`,
    emoji: "🪙",
  };
}

function applyLootboxReward(
  progress: PlayerProgress,
  reward: LootboxReward
): PlayerProgress {
  if (reward.type === "coins") {
    return {
      ...progress,
      coins: safeNumber(progress.coins) + reward.amount,
      lifetimeCoins: safeNumber(progress.lifetimeCoins) + reward.amount,
    };
  }

  if (reward.type === "avatar") {
    const current = progress.unlockedAvatarIds || [];

    return {
      ...progress,
      unlockedAvatarIds: [
        reward.avatarId,
        ...current.filter((id) => id !== reward.avatarId),
      ],
      currentAvatarId: reward.avatarId,
    };
  }

  const current = progress.unlockedTitleIds || [];

  return {
    ...progress,
    unlockedTitleIds: [
      reward.titleId,
      ...current.filter((id) => id !== reward.titleId),
    ],
    equippedTitleId: reward.titleId,
  };
}

export const claimDailyMissionReward = onCall(async (request) => {
  const userId = requireUid(request);
  const missionId = String(request.data?.missionId || "");
  const clientProgress = request.data?.progress as PlayerProgress | undefined;
  const reward = DAILY_MISSION_REWARDS[missionId];

  if (!reward) {
    throw new HttpsError("invalid-argument", "Unknown mission.");
  }

  const claimId = `${todayKey()}_${missionId}`;
  const missionClaimRef = claimRef(userId, claimId);
  const userProgressRef = progressRef(userId);
  const txRef = transactionRef();

  return db.runTransaction(async (transaction) => {
    const claimSnap = await transaction.get(missionClaimRef);
    const progressSnap = await transaction.get(userProgressRef);

    if (claimSnap.exists) {
      throw new HttpsError("already-exists", "Mission already claimed.");
    }

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      clientProgress ||
      {};

    const updatedProgress = addRewardToProgress(storedProgress, reward);
    const claimedIds = new Set(updatedProgress.dailyMissionClaimedIds || []);
    claimedIds.add(missionId);

    updatedProgress.dailyMissionClaimedIds = Array.from(claimedIds);

    const transactionData = {
      userId,
      source: "daily_mission",
      sourceId: claimId,
      missionId,
      xp: reward.xp || 0,
      coins: reward.coins || 0,
      energy: reward.energy || 0,
      lootBoxes: reward.lootBoxes || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    };

    transaction.set(missionClaimRef, {
      userId,
      missionId,
      claimId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    transaction.set(txRef, transactionData);

    transaction.set(
      userProgressRef,
      {
        schemaVersion: 1,
        userId,
        progress: updatedProgress,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deviceUpdatedAt: Date.now(),
        writeSource: "server_claim_daily_mission",
      },
      {
        merge: true,
      }
    );

    transaction.set(
      economyRef(userId),
      {
        userId,
        coins: updatedProgress.coins || 0,
        xp: updatedProgress.xp || 0,
        energy: updatedProgress.energy || 0,
        lootBoxes: updatedProgress.lootBoxes || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      success: true,
      message: "Mission reward claimed.",
      reward,
      progress: updatedProgress,
    };
  });
});

export const openServerLootBox = onCall(async (request) => {
  const userId = requireUid(request);
  const clientProgress = request.data?.progress as PlayerProgress | undefined;
  const userProgressRef = progressRef(userId);
  const openRef = crateOpenRef();
  const txRef = transactionRef();

  return db.runTransaction(async (transaction) => {
    const progressSnap = await transaction.get(userProgressRef);

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      clientProgress ||
      {};

    if (safeNumber(storedProgress.lootBoxes) <= 0) {
      throw new HttpsError("failed-precondition", "No crates available.");
    }

    const rarity = rollRarity();
    const reward = generateLootboxReward(storedProgress, rarity);

    const afterSpend = {
      ...storedProgress,
      lootBoxes: Math.max(0, safeNumber(storedProgress.lootBoxes) - 1),
      lootBoxesOpened: safeNumber(storedProgress.lootBoxesOpened) + 1,
    };

    const updatedProgress = applyLootboxReward(afterSpend, reward);

    const transactionData = {
      userId,
      source: "crate_open",
      sourceId: openRef.id,
      rarity,
      reward,
      coins: reward.type === "coins" ? reward.amount : 0,
      xp: 0,
      energy: 0,
      lootBoxes: -1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    };

    transaction.set(openRef, {
      userId,
      rarity,
      reward,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    transaction.set(txRef, transactionData);

    transaction.set(
      userProgressRef,
      {
        schemaVersion: 1,
        userId,
        progress: updatedProgress,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deviceUpdatedAt: Date.now(),
        writeSource: "server_open_lootbox",
      },
      {
        merge: true,
      }
    );

    transaction.set(
      economyRef(userId),
      {
        userId,
        coins: updatedProgress.coins || 0,
        xp: updatedProgress.xp || 0,
        energy: updatedProgress.energy || 0,
        lootBoxes: updatedProgress.lootBoxes || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      success: true,
      message: "Crate opened.",
      rarity,
      reward,
      progress: updatedProgress,
    };
  });
});


export const completePuzzleServer = onCall(async (request) => {
  const userId = requireUid(request);
  const payload = request.data as PuzzleCompletePayload | undefined;

  if (!payload?.puzzle?.id || !payload?.puzzle?.difficulty) {
    throw new HttpsError("invalid-argument", "Puzzle payload is required.");
  }

  const userProgressRef = progressRef(userId);
  const completeRef = puzzleCompleteRef(userId, payload.puzzle.id);
  const txRef = transactionRef();

  return db.runTransaction(async (transaction) => {
    const progressSnap = await transaction.get(userProgressRef);
    const completeSnap = await transaction.get(completeRef);

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      payload.progress ||
      {};

    const storedCompleted = new Set(
      (((storedProgress as any).completedPuzzleIds || []) as string[])
    );

    const alreadyCompleted = completeSnap.exists || storedCompleted.has(payload.puzzle.id);

    const serverPayload: PuzzleCompletePayload = {
      ...payload,
      alreadyCompleted,
    };

    const reward = calculateServerPuzzleReward(serverPayload, storedProgress);
    const updatedProgress = addPuzzleRewardToProgress(
      storedProgress,
      serverPayload,
      reward
    );

    transaction.set(
      completeRef,
      {
        userId,
        puzzleId: payload.puzzle.id,
        puzzleIndex: payload.puzzleIndex,
        difficulty: payload.puzzle.difficulty,
        isDailyMode: payload.isDailyMode,
        wasFailed: payload.wasFailed,
        isPerfect: payload.isPerfect,
        usedNoHints: payload.usedNoHints,
        reward,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAtMs: Date.now(),
      },
      {
        merge: false,
      }
    );

    transaction.set(txRef, {
      userId,
      source: "puzzle_complete",
      sourceId: payload.puzzle.id,
      puzzleId: payload.puzzle.id,
      puzzleIndex: payload.puzzleIndex,
      difficulty: payload.puzzle.difficulty,
      xp: reward.xp,
      coins: reward.coins,
      energy: 0,
      lootBoxes: reward.lootBoxes,
      skillPoints: reward.skillPoints,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    transaction.set(
      userProgressRef,
      {
        schemaVersion: 1,
        userId,
        progress: updatedProgress,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deviceUpdatedAt: Date.now(),
        writeSource: "server_complete_puzzle",
      },
      {
        merge: true,
      }
    );

    transaction.set(
      economyRef(userId),
      {
        userId,
        coins: updatedProgress.coins || 0,
        xp: updatedProgress.xp || 0,
        energy: updatedProgress.energy || 0,
        lootBoxes: updatedProgress.lootBoxes || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      success: true,
      message: alreadyCompleted
        ? "Puzzle already completed. No reward granted."
        : "Puzzle reward claimed.",
      alreadyCompleted,
      reward,
      progress: updatedProgress,
    };
  });
});


export const spendEnergyServer = onCall(async (request) => {
  const userId = requireUid(request);
  const amount = Math.max(1, Number(request.data?.amount || 1));
  const clientProgress = request.data?.progress as PlayerProgress | undefined;
  const userProgressRef = progressRef(userId);
  const txRef = transactionRef();

  return db.runTransaction(async (transaction) => {
    const progressSnap = await transaction.get(userProgressRef);

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      clientProgress ||
      {};

    const charged = applyServerEnergyRecharge(storedProgress);

    if (safeNumber(charged.energy) < amount) {
      throw new HttpsError("failed-precondition", "Not enough energy.");
    }

    const wasFull = safeNumber(charged.energy) >= (safeNumber(charged.maxEnergy) || 20);

    const updatedProgress: PlayerProgress = {
      ...charged,
      energy: safeNumber(charged.energy) - amount,
      totalEnergySpent: safeNumber(charged.totalEnergySpent) + amount,
      energySpentToday: safeNumber(charged.energySpentToday) + amount,
      lastEnergyAt: wasFull ? Date.now() : charged.lastEnergyAt,
    };

    transaction.set(txRef, {
      userId,
      source: "energy_spend",
      sourceId: `energy_${Date.now()}`,
      amount: -amount,
      coins: 0,
      xp: 0,
      energy: -amount,
      lootBoxes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    saveProgressAndEconomy(
      transaction,
      userId,
      updatedProgress,
      "server_spend_energy"
    );

    return {
      success: true,
      message: "Energy spent.",
      progress: updatedProgress,
    };
  });
});

export const watchAdForEnergyServer = onCall(async (request) => {
  const userId = requireUid(request);
  const clientProgress = request.data?.progress as PlayerProgress | undefined;
  const userProgressRef = progressRef(userId);
  const txRef = transactionRef();
  const today = todayKey();

  return db.runTransaction(async (transaction) => {
    const progressSnap = await transaction.get(userProgressRef);

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      clientProgress ||
      {};

    const charged = applyServerEnergyRecharge(storedProgress);
    const viewsToday =
      charged.energyAdViewsDate === today
        ? safeNumber(charged.energyAdViewsToday)
        : 0;

    if (safeNumber(charged.energy) > 0) {
      throw new HttpsError(
        "failed-precondition",
        "Energy ad refills are only available when energy is empty."
      );
    }

    if (viewsToday >= SERVER_MAX_DAILY_ENERGY_ADS) {
      throw new HttpsError("resource-exhausted", "Daily energy ad limit reached.");
    }

    const maxEnergy = safeNumber(charged.maxEnergy) || 20;
    const gained = Math.min(SERVER_AD_ENERGY_REWARD, maxEnergy - safeNumber(charged.energy));

    const updatedProgress: PlayerProgress = {
      ...charged,
      energy: Math.min(maxEnergy, safeNumber(charged.energy) + SERVER_AD_ENERGY_REWARD),
      energyAdViewsDate: today,
      energyAdViewsToday: viewsToday + 1,
      totalEnergyFromAds: safeNumber(charged.totalEnergyFromAds) + gained,
      adEnergyRefillsToday: safeNumber(charged.adEnergyRefillsToday) + 1,
      lastEnergyAt: Date.now(),
    };

    transaction.set(txRef, {
      userId,
      source: "energy_ad_refill",
      sourceId: `energy_ad_${today}_${viewsToday + 1}`,
      amount: gained,
      coins: 0,
      xp: 0,
      energy: gained,
      lootBoxes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    saveProgressAndEconomy(
      transaction,
      userId,
      updatedProgress,
      "server_watch_ad_energy"
    );

    return {
      success: true,
      message: `+${gained} energy added.`,
      gained,
      progress: updatedProgress,
    };
  });
});

export const buyEnergyPackServer = onCall(async (request) => {
  const userId = requireUid(request);
  const amount = Math.max(1, Number(request.data?.amount || 0));
  const cost = Math.max(0, Number(request.data?.cost || 0));
  const clientProgress = request.data?.progress as PlayerProgress | undefined;
  const userProgressRef = progressRef(userId);
  const txRef = transactionRef();

  if (!amount || !cost) {
    throw new HttpsError("invalid-argument", "Energy pack amount and cost are required.");
  }

  return db.runTransaction(async (transaction) => {
    const progressSnap = await transaction.get(userProgressRef);

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      clientProgress ||
      {};

    const charged = applyServerEnergyRecharge(storedProgress);

    if (safeNumber(charged.coins) < cost) {
      throw new HttpsError("failed-precondition", `You need ${cost} coins.`);
    }

    const maxEnergy = safeNumber(charged.maxEnergy) || 20;

    const updatedProgress: PlayerProgress = {
      ...charged,
      coins: safeNumber(charged.coins) - cost,
      energy: Math.min(maxEnergy, safeNumber(charged.energy) + amount),
      lastEnergyAt: Date.now(),
    };

    transaction.set(txRef, {
      userId,
      source: "energy_pack",
      sourceId: `energy_pack_${amount}_${Date.now()}`,
      amount,
      coins: -cost,
      xp: 0,
      energy: amount,
      lootBoxes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    saveProgressAndEconomy(
      transaction,
      userId,
      updatedProgress,
      "server_buy_energy_pack"
    );

    return {
      success: true,
      message: `+${amount} energy purchased.`,
      progress: updatedProgress,
    };
  });
});


export const claimEventTaskReward = onCall(async (request) => {
  const userId = requireUid(request);
  const taskId = String(request.data?.taskId || "");
  const eventId = String(request.data?.eventId || "cozy_kickoff");
  const clientProgress = request.data?.progress as PlayerProgress | undefined;
  const reward = EVENT_TASK_REWARDS[taskId];

  if (!reward) {
    throw new HttpsError("invalid-argument", "Unknown event task.");
  }

  const claimId = `${eventId}_${taskId}`;
  const taskClaimRef = eventClaimRef(userId, claimId);
  const userProgressRef = progressRef(userId);
  const txRef = transactionRef();

  return db.runTransaction(async (transaction) => {
    const claimSnap = await transaction.get(taskClaimRef);
    const progressSnap = await transaction.get(userProgressRef);

    if (claimSnap.exists) {
      throw new HttpsError("already-exists", "Event reward already claimed.");
    }

    const storedProgress =
      (progressSnap.exists
        ? (progressSnap.data()?.progress as PlayerProgress)
        : undefined) ||
      clientProgress ||
      {};

    const claimedIds = new Set(storedProgress.eventClaimedTaskIds || []);
    claimedIds.add(taskId);

    const updatedProgress = addRewardToProgress(
      {
        ...storedProgress,
        eventClaimedTaskIds: Array.from(claimedIds),
      },
      reward
    );

    transaction.set(taskClaimRef, {
      userId,
      eventId,
      taskId,
      claimId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    transaction.set(txRef, {
      userId,
      source: "event_reward",
      sourceId: claimId,
      eventId,
      taskId,
      xp: reward.xp || 0,
      coins: reward.coins || 0,
      energy: reward.energy || 0,
      lootBoxes: reward.lootBoxes || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    saveProgressAndEconomy(
      transaction,
      userId,
      updatedProgress,
      "server_claim_event_task"
    );

    return {
      success: true,
      message: "Event reward claimed.",
      reward,
      progress: updatedProgress,
    };
  });
});
