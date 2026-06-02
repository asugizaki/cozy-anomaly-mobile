import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestore, firebaseConfigured } from "./firebase";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
  saveProgress,
} from "./player-progress";

export type CloudSaveDocument = {
  schemaVersion: number;
  userId: string;
  progress: PlayerProgress;
  updatedAt?: unknown;
  deviceUpdatedAt: number;
};

function progressDocRef(userId: string) {
  return doc(firestore, "users", userId, "private", "progress");
}

function mergeArrays<T>(a?: T[], b?: T[]) {
  return Array.from(new Set([...(a || []), ...(b || [])]));
}

function maxNumber(a?: number, b?: number) {
  return Math.max(Number(a || 0), Number(b || 0));
}

export function mergeProgress(
  local: PlayerProgress,
  remote: PlayerProgress
): PlayerProgress {
  return {
    ...DEFAULT_PROGRESS,
    ...local,
    ...remote,

    // Keep additive/highest values conservative.
    xp: maxNumber(local.xp, remote.xp),
    level: maxNumber(local.level, remote.level),
    coins: maxNumber(local.coins, remote.coins),
    lifetimeCoins: maxNumber(local.lifetimeCoins, remote.lifetimeCoins),

    energy: maxNumber(local.energy, remote.energy),
    maxEnergy: maxNumber(local.maxEnergy, remote.maxEnergy),
    lastEnergyAt: Math.max(
      Number(local.lastEnergyAt || 0),
      Number(remote.lastEnergyAt || 0)
    ),

    currentStreak: maxNumber(local.currentStreak, remote.currentStreak),
    bestStreak: maxNumber(local.bestStreak, remote.bestStreak),
    totalSolved: maxNumber(local.totalSolved, remote.totalSolved),
    hintsUsed: maxNumber(local.hintsUsed, remote.hintsUsed),
    totalWrongTaps: maxNumber(local.totalWrongTaps, remote.totalWrongTaps),
    perfectGames: maxNumber(local.perfectGames, remote.perfectGames),
    dailyChallengesCompleted: maxNumber(
      local.dailyChallengesCompleted,
      remote.dailyChallengesCompleted
    ),

    skillPoints: maxNumber(local.skillPoints, remote.skillPoints),
    spentSkillPoints: maxNumber(local.spentSkillPoints, remote.spentSkillPoints),
    lootBoxes: maxNumber(local.lootBoxes, remote.lootBoxes),
    lootBoxesOpened: maxNumber(local.lootBoxesOpened, remote.lootBoxesOpened),

    completedPuzzleIds: mergeArrays(
      local.completedPuzzleIds,
      remote.completedPuzzleIds
    ),
    favoritePuzzleIds: mergeArrays(
      local.favoritePuzzleIds,
      remote.favoritePuzzleIds
    ),
    recentPlayedPuzzleIds: mergeArrays(
      local.recentPlayedPuzzleIds,
      remote.recentPlayedPuzzleIds
    ).slice(0, 15),
    completedDailyKeys: mergeArrays(
      local.completedDailyKeys,
      remote.completedDailyKeys
    ),
    recentPuzzleIndexes: mergeArrays(
      local.recentPuzzleIndexes,
      remote.recentPuzzleIndexes
    ).slice(-15),

    unlockedSkillNodeIds: mergeArrays(
      local.unlockedSkillNodeIds,
      remote.unlockedSkillNodeIds
    ),
    unlockedAvatarIds: mergeArrays(
      local.unlockedAvatarIds,
      remote.unlockedAvatarIds
    ),
    unlockedTitleIds: mergeArrays(
      local.unlockedTitleIds,
      remote.unlockedTitleIds
    ),
    claimedCollectionRewardIds: mergeArrays(
      local.claimedCollectionRewardIds,
      remote.claimedCollectionRewardIds
    ),
    dailyMissionClaimedIds: mergeArrays(
      local.dailyMissionClaimedIds,
      remote.dailyMissionClaimedIds
    ),
    eventClaimedTaskIds: mergeArrays(
      local.eventClaimedTaskIds,
      remote.eventClaimedTaskIds
    ),

    currentAvatarId: remote.currentAvatarId || local.currentAvatarId,
    equippedTitleId: remote.equippedTitleId || local.equippedTitleId,
  };
}

export async function uploadCloudSave(userId: string) {
  if (!firebaseConfigured()) {
    throw new Error("Firebase is not configured.");
  }

  const progress = await loadProgress();

  const payload: CloudSaveDocument = {
    schemaVersion: 1,
    userId,
    progress,
    updatedAt: serverTimestamp(),
    deviceUpdatedAt: Date.now(),
  };

  await setDoc(progressDocRef(userId), payload, {
    merge: true,
  });

  return progress;
}

export async function downloadCloudSave(userId: string) {
  if (!firebaseConfigured()) {
    throw new Error("Firebase is not configured.");
  }

  const snapshot = await getDoc(progressDocRef(userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as CloudSaveDocument;

  return data.progress || null;
}

export async function syncCloudSave(userId: string) {
  const local = await loadProgress();
  const remote = await downloadCloudSave(userId);

  const merged = remote ? mergeProgress(local, remote) : local;

  await saveProgress(merged);

  await setDoc(
    progressDocRef(userId),
    {
      schemaVersion: 1,
      userId,
      progress: merged,
      updatedAt: serverTimestamp(),
      deviceUpdatedAt: Date.now(),
    },
    {
      merge: true,
    }
  );

  return {
    hadRemote: Boolean(remote),
    progress: merged,
  };
}
