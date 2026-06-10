import { ECONOMY_CONFIG } from "./economy-config";
import { loadProgress, PlayerProgress, saveProgress } from "./player-progress";

export type MissionReward = {
  xp?: number;
  coins?: number;
  energy?: number;
  lootBoxes?: number;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: MissionReward;
  completed: boolean;
  claimed: boolean;
};

export function dailyMissions(progress: PlayerProgress): Mission[] {
  const solvedToday = Math.max(
    0,
    (progress.totalSolved || 0) - (progress.dailyStartTotalSolved || 0)
  );

  const perfectToday = Math.max(
    0,
    (progress.perfectGames || 0) - (progress.dailyStartPerfectGames || 0)
  );

  const hintsToday = Math.max(
    0,
    (progress.hintsUsed || 0) - (progress.dailyStartHintsUsed || 0)
  );

  const wrongTapsToday = Math.max(
    0,
    (progress.totalWrongTaps || 0) - (progress.dailyStartTotalWrongTaps || 0)
  );

  const claimed = new Set(progress.dailyMissionClaimedIds || []);

  const missions: Omit<Mission, "completed" | "claimed">[] = [
    {
      id: "daily_solve_5",
      title: "Cozy Warmup",
      description: "Solve 5 puzzles.",
      target: 5,
      current: solvedToday,
      reward: {
        xp: ECONOMY_CONFIG.missions.dailySolve5.xp,
        coins: ECONOMY_CONFIG.missions.dailySolve5.coins,
      },
    },
    {
      id: "daily_perfect_1",
      title: "Sharp Eyes",
      description: "Clear 1 puzzle perfectly.",
      target: 1,
      current: perfectToday,
      reward: {
        xp: ECONOMY_CONFIG.missions.dailyPerfect1.xp,
        coins: ECONOMY_CONFIG.missions.dailyPerfect1.coins,
      },
    },
    {
      id: "daily_spend_energy_10",
      title: "Keep Exploring",
      description: "Spend 10 energy.",
      target: 10,
      current: progress.energySpentToday || 0,
      reward: {
        coins: ECONOMY_CONFIG.missions.dailySpendEnergy10.coins,
        energy: ECONOMY_CONFIG.missions.dailySpendEnergy10.energy,
      },
    },
    {
      id: "daily_ad_energy_1",
      title: "Bonus Refill",
      description: "Use 1 ad energy refill.",
      target: 1,
      current: progress.adEnergyRefillsToday || 0,
      reward: {
        xp: ECONOMY_CONFIG.missions.dailyAdEnergy1.xp,
        coins: ECONOMY_CONFIG.missions.dailyAdEnergy1.coins,
      },
    },
    {
      id: "daily_careful_play",
      title: "Careful Detective",
      description: "Solve 3 puzzles with 5 or fewer wrong taps today.",
      target: 3,
      current: wrongTapsToday <= 5 ? solvedToday : 0,
      reward: {
        xp: ECONOMY_CONFIG.missions.dailyCarefulPlay.xp,
        lootBoxes: ECONOMY_CONFIG.missions.dailyCarefulPlay.lootBoxes,
      },
    },
  ];

  return missions.map((mission) => ({
    ...mission,
    current: Math.min(mission.current, mission.target),
    completed: mission.current >= mission.target,
    claimed: claimed.has(mission.id),
  }));
}

export async function claimDailyMission(missionId: string) {
  const progress = await loadProgress();
  const mission = dailyMissions(progress).find((item) => item.id === missionId);

  if (!mission) {
    return {
      success: false,
      message: "Mission not found.",
      progress,
    };
  }

  if (!mission.completed) {
    return {
      success: false,
      message: "Mission is not complete yet.",
      progress,
    };
  }

  if (mission.claimed) {
    return {
      success: false,
      message: "Mission already claimed.",
      progress,
    };
  }

  const reward = mission.reward;

  const updated: PlayerProgress = {
    ...progress,
    xp: (progress.xp || 0) + (reward.xp || 0),
    coins: (progress.coins || 0) + (reward.coins || 0),
    lifetimeCoins: (progress.lifetimeCoins || 0) + (reward.coins || 0),
    energy: (progress.energy || 0) + (reward.energy || 0),
    lastEnergyAt:
      (progress.energy || 0) + (reward.energy || 0) >= (progress.maxEnergy || ECONOMY_CONFIG.energy.baseEnergy)
        ? Date.now()
        : progress.lastEnergyAt,
    lootBoxes: (progress.lootBoxes || 0) + (reward.lootBoxes || 0),
    dailyMissionClaimedIds: [
      mission.id,
      ...(progress.dailyMissionClaimedIds || []),
    ],
  };

  await saveProgress(updated);

  return {
    success: true,
    message: "Mission reward claimed.",
    progress: updated,
  };
}
