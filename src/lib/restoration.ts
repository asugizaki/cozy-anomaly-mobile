import { chapterById, chapterSummary, ChapterSummary } from "./chapters";
import { loadProgress, PlayerProgress, saveProgress } from "./player-progress";

export type RepairReward = {
  xp: number;
  coins: number;
  lootBoxes: number;
};

export type RepairRewardResult = {
  success: boolean;
  message: string;
  reward?: RepairReward;
  progress: PlayerProgress;
};

export function repairRewardId(chapterId: string, repairId: string) {
  return `chapter_repair:${chapterId}:${repairId}`;
}

export function repairRewardForMilestone(completedAt: number): RepairReward {
  if (completedAt >= 80) {
    return {
      xp: 200,
      coins: 300,
      lootBoxes: 1,
    };
  }

  if (completedAt >= 60) {
    return {
      xp: 150,
      coins: 220,
      lootBoxes: 1,
    };
  }

  if (completedAt >= 40) {
    return {
      xp: 110,
      coins: 160,
      lootBoxes: 0,
    };
  }

  return {
    xp: 75,
    coins: 120,
    lootBoxes: 0,
  };
}

export function readyRepairRewards(
  chapter: ChapterSummary,
  progress: PlayerProgress
) {
  const claimed = new Set(progress.claimedChapterRepairRewardIds || []);

  return chapter.repairs.filter((repair) => {
    const id = repairRewardId(chapter.id, repair.id);

    return chapter.completed >= repair.completedAt && !claimed.has(id);
  });
}

export function tanukiLineForChapter(chapter: ChapterSummary) {
  if (chapter.fullyRestored) {
    return "Amazing! This place is glowing again. I knew your sharp eyes could do it!";
  }

  if (chapter.nextRepair) {
    const remaining = Math.max(0, chapter.nextRepair.completedAt - chapter.completed);

    return `${remaining} more puzzle${
      remaining === 1 ? "" : "s"
    } until we can ${chapter.nextRepair.title.toLowerCase()}.`;
  }

  return chapter.intro;
}

export async function claimChapterRepairReward(
  chapterId: string,
  repairId: string
): Promise<RepairRewardResult> {
  const progress = await loadProgress();
  const chapter = chapterSummary(chapterById(chapterId), progress, true);
  const repair = chapter.repairs.find((item) => item.id === repairId);

  if (!repair) {
    return {
      success: false,
      message: "Repair not found.",
      progress,
    };
  }

  if (chapter.completed < repair.completedAt) {
    return {
      success: false,
      message: "This repair is not ready yet.",
      progress,
    };
  }

  const rewardId = repairRewardId(chapterId, repairId);

  if ((progress.claimedChapterRepairRewardIds || []).includes(rewardId)) {
    return {
      success: false,
      message: "Repair reward already claimed.",
      progress,
    };
  }

  const reward = repairRewardForMilestone(repair.completedAt);

  const updated: PlayerProgress = {
    ...progress,
    xp: (progress.xp || 0) + reward.xp,
    coins: (progress.coins || 0) + reward.coins,
    lifetimeCoins: (progress.lifetimeCoins || 0) + reward.coins,
    lootBoxes: (progress.lootBoxes || 0) + reward.lootBoxes,
    bonusTanukiTickets: (progress.bonusTanukiTickets || 0) + 1,
    claimedChapterRepairRewardIds: [
      rewardId,
      ...(progress.claimedChapterRepairRewardIds || []),
    ],
  };

  await saveProgress(updated);

  return {
    success: true,
    message: `${repair.title} restored!`,
    reward,
    progress: updated,
  };
}
