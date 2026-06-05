import { BonusTanukiRewardConfig } from "@/data/generatedBonusTanukiScenes";
import { loadProgress, saveProgress } from "./player-progress";

export type BonusTanukiReward = {
  xp: number;
  coins: number;
  energy: number;
  lootBoxes: number;
  avatarUnlocked?: string;
};

export async function claimBonusTanukiReward(
  rewardConfig?: Partial<BonusTanukiRewardConfig>
) {
  const progress = await loadProgress();

  if ((progress.bonusTanukiTickets || 0) <= 0) {
    return {
      success: false,
      message: "No bonus tickets available.",
      progress,
    };
  }

  const config = {
    xp: rewardConfig?.xp ?? 200,
    coins: rewardConfig?.coins ?? 250,
    energy: rewardConfig?.energy ?? 1,
    lootBoxChance: rewardConfig?.lootBoxChance ?? 0.25,
    rareAvatarChance: rewardConfig?.rareAvatarChance ?? 0.05,
  };

  const rareAvatarChance = Math.random() < config.rareAvatarChance;

  const reward: BonusTanukiReward = {
    xp: config.xp,
    coins: config.coins,
    energy: config.energy,
    lootBoxes: Math.random() < config.lootBoxChance ? 1 : 0,
    avatarUnlocked: rareAvatarChance ? "golden_tanuki" : undefined,
  };

  const unlockedAvatarIds = [...(progress.unlockedAvatarIds || [])];

  if (
    reward.avatarUnlocked &&
    !unlockedAvatarIds.includes(reward.avatarUnlocked)
  ) {
    unlockedAvatarIds.push(reward.avatarUnlocked);
  }

  const updated = {
    ...progress,
    bonusTanukiTickets: Math.max(0, (progress.bonusTanukiTickets || 0) - 1),
    xp: (progress.xp || 0) + reward.xp,
    coins: (progress.coins || 0) + reward.coins,
    lifetimeCoins: (progress.lifetimeCoins || 0) + reward.coins,
    energy: Math.min(
      progress.maxEnergy || 20,
      (progress.energy || 0) + reward.energy
    ),
    lootBoxes: (progress.lootBoxes || 0) + reward.lootBoxes,
    unlockedAvatarIds,
    completedBonusTanukiIds: [
      `bonus_${Date.now()}`,
      ...(progress.completedBonusTanukiIds || []),
    ],
  };

  await saveProgress(updated);

  return {
    success: true,
    reward,
    progress: updated,
    message: reward.avatarUnlocked
      ? "Legendary Golden Tanuki unlocked!"
      : "Tanuki found!",
  };
}
