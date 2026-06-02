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
        xp: 60,
        coins: 80,
      },
    },
    {
      id: "daily_perfect_1",
      title: "Sharp Eyes",
      description: "Clear 1 puzzle perfectly.",
      target: 1,
      current: perfectToday,
      reward: {
        xp: 40,
        coins: 60,
      },
    },
    {
      id: "daily_spend_energy_10",
      title: "Keep Exploring",
      description: "Spend 10 energy.",
      target: 10,
      current: progress.energySpentToday || 0,
      reward: {
        coins: 100,
        energy: 3,
      },
    },
    {
      id: "daily_ad_energy_1",
      title: "Bonus Refill",
      description: "Use 1 ad energy refill.",
      target: 1,
      current: progress.adEnergyRefillsToday || 0,
      reward: {
        xp: 30,
        coins: 50,
      },
    },
    {
      id: "daily_careful_play",
      title: "Careful Detective",
      description: "Solve 3 puzzles with 5 or fewer wrong taps today.",
      target: 3,
      current: wrongTapsToday <= 5 ? solvedToday : 0,
      reward: {
        xp: 50,
        lootBoxes: 1,
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
    energy: Math.min(progress.maxEnergy, (progress.energy || 0) + (reward.energy || 0)),
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
