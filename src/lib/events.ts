import { ECONOMY_CONFIG } from "./economy-config";
import { loadProgress, PlayerProgress, saveProgress } from "./player-progress";

export type EventTaskReward = {
  xp?: number;
  coins?: number;
  energy?: number;
  lootBoxes?: number;
};

export type EventTask = {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: EventTaskReward;
  completed: boolean;
  claimed: boolean;
};

export const ACTIVE_EVENT = {
  id: "cozy_kickoff",
  title: "Cozy Kickoff Event",
  subtitle: "Complete tasks to earn coins, crates, and energy.",
};

export function activeEventTasks(progress: PlayerProgress): EventTask[] {
  const claimed = new Set(progress.eventClaimedTaskIds || []);

  const solved = Math.max(
    0,
    (progress.totalSolved || 0) - (progress.eventStartTotalSolved || 0)
  );

  const perfect = Math.max(
    0,
    (progress.perfectGames || 0) - (progress.eventStartPerfectGames || 0)
  );

  const openedCrates = Math.max(
    0,
    (progress.lootBoxesOpened || 0) - (progress.eventStartLootBoxesOpened || 0)
  );

  const tasks: Omit<EventTask, "completed" | "claimed">[] = [
    {
      id: "event_solve_25",
      title: "Puzzle Sprint",
      description: "Solve 25 puzzles during the event.",
      target: 25,
      current: solved,
      reward: {
        xp: ECONOMY_CONFIG.events.solve25.xp,
        coins: ECONOMY_CONFIG.events.solve25.coins,
      },
    },
    {
      id: "event_perfect_10",
      title: "Perfect Focus",
      description: "Get 10 perfect clears.",
      target: 10,
      current: perfect,
      reward: {
        coins: ECONOMY_CONFIG.events.perfect10.coins,
        lootBoxes: ECONOMY_CONFIG.events.perfect10.lootBoxes,
      },
    },
    {
      id: "event_spend_energy_40",
      title: "Energy Explorer",
      description: "Spend 40 energy.",
      target: 40,
      current: progress.totalEnergySpent || 0,
      reward: {
        xp: ECONOMY_CONFIG.events.spendEnergy40.xp,
        energy: ECONOMY_CONFIG.events.spendEnergy40.energy,
      },
    },
    {
      id: "event_open_crates_3",
      title: "Crate Collector",
      description: "Open 3 crates.",
      target: 3,
      current: openedCrates,
      reward: {
        lootBoxes: ECONOMY_CONFIG.events.openCrates3.lootBoxes,
        coins: ECONOMY_CONFIG.events.openCrates3.coins,
      },
    },
  ];

  return tasks.map((task) => ({
    ...task,
    current: Math.min(task.current, task.target),
    completed: task.current >= task.target,
    claimed: claimed.has(task.id),
  }));
}

export async function claimEventTask(taskId: string) {
  const progress = await loadProgress();
  const task = activeEventTasks(progress).find((item) => item.id === taskId);

  if (!task) {
    return {
      success: false,
      message: "Event task not found.",
      progress,
    };
  }

  if (!task.completed) {
    return {
      success: false,
      message: "Event task is not complete yet.",
      progress,
    };
  }

  if (task.claimed) {
    return {
      success: false,
      message: "Event task already claimed.",
      progress,
    };
  }

  const reward = task.reward;

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
    eventClaimedTaskIds: [task.id, ...(progress.eventClaimedTaskIds || [])],
  };

  await saveProgress(updated);

  return {
    success: true,
    message: "Event reward claimed.",
    progress: updated,
  };
}
