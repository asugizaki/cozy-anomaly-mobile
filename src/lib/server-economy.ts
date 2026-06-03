import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp, firebaseAuth, firebaseConfigured } from "./firebase";
import { PlayerProgress, saveProgress } from "./player-progress";

const functions = getFunctions(firebaseApp);

export function serverEconomyAvailable() {
  return firebaseConfigured() && Boolean(firebaseAuth.currentUser);
}

export async function claimDailyMissionRewardServer(
  missionId: string,
  progress: PlayerProgress
) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    {
      missionId: string;
      progress: PlayerProgress;
    },
    {
      success: boolean;
      message: string;
      reward: {
        xp?: number;
        coins?: number;
        energy?: number;
        lootBoxes?: number;
      };
      progress: PlayerProgress;
    }
  >(functions, "claimDailyMissionReward");

  const response = await callable({
    missionId,
    progress,
  });

  await saveProgress(response.data.progress);

  return response.data;
}

export async function openLootBoxServer(progress: PlayerProgress) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    {
      progress: PlayerProgress;
    },
    {
      success: boolean;
      message: string;
      rarity: "common" | "rare" | "epic";
      reward: any;
      progress: PlayerProgress;
    }
  >(functions, "openServerLootBox");

  const response = await callable({
    progress,
  });

  await saveProgress(response.data.progress);

  return response.data;
}


export async function completePuzzleServerReward(options: {
  progress: PlayerProgress;
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
}) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    typeof options,
    {
      success: boolean;
      message: string;
      alreadyCompleted: boolean;
      reward: {
        xp: number;
        coins: number;
        lootBoxes: number;
        skillPoints: number;
        levelBefore: number;
        levelAfter: number;
        leveledUp: boolean;
        reasons: string[];
      };
      progress: PlayerProgress;
    }
  >(functions, "completePuzzleServer");

  const response = await callable(options);

  await saveProgress(response.data.progress);

  return response.data;
}


export async function spendEnergyServerCall(
  progress: PlayerProgress,
  amount = 1
) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    {
      progress: PlayerProgress;
      amount: number;
    },
    {
      success: boolean;
      message: string;
      progress: PlayerProgress;
    }
  >(functions, "spendEnergyServer");

  const response = await callable({
    progress,
    amount,
  });

  await saveProgress(response.data.progress);

  return response.data;
}

export async function watchAdForEnergyServerCall(progress: PlayerProgress) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    {
      progress: PlayerProgress;
    },
    {
      success: boolean;
      message: string;
      gained: number;
      progress: PlayerProgress;
    }
  >(functions, "watchAdForEnergyServer");

  const response = await callable({
    progress,
  });

  await saveProgress(response.data.progress);

  return response.data;
}

export async function buyEnergyPackServerCall(
  progress: PlayerProgress,
  amount: number,
  cost: number
) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    {
      progress: PlayerProgress;
      amount: number;
      cost: number;
    },
    {
      success: boolean;
      message: string;
      progress: PlayerProgress;
    }
  >(functions, "buyEnergyPackServer");

  const response = await callable({
    progress,
    amount,
    cost,
  });

  await saveProgress(response.data.progress);

  return response.data;
}


export async function claimEventTaskRewardServer(
  eventId: string,
  taskId: string,
  progress: PlayerProgress
) {
  if (!serverEconomyAvailable()) {
    return null;
  }

  const callable = httpsCallable<
    {
      eventId: string;
      taskId: string;
      progress: PlayerProgress;
    },
    {
      success: boolean;
      message: string;
      reward: {
        xp?: number;
        coins?: number;
        energy?: number;
        lootBoxes?: number;
      };
      progress: PlayerProgress;
    }
  >(functions, "claimEventTaskReward");

  const response = await callable({
    eventId,
    taskId,
    progress,
  });

  await saveProgress(response.data.progress);

  return response.data;
}
