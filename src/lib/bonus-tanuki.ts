import { BonusTanukiRewardConfig } from "@/data/generatedBonusTanukiScenes";
import { ECONOMY_CONFIG } from "./economy-config";
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

  const config = {
    xp: rewardConfig?.xp ?? ECONOMY_CONFIG.bonusTanuki.defaultXp,
    coins: rewardConfig?.coins ?? ECONOMY_CONFIG.bonusTanuki.defaultCoins,
    energy: rewardConfig?.energy ?? ECONOMY_CONFIG.bonusTanuki.defaultEnergy,
    lootBoxChance:
      rewardConfig?.lootBoxChance ?? ECONOMY_CONFIG.bonusTanuki.defaultLootBoxChance,
    rareAvatarChance:
      rewardConfig?.rareAvatarChance ?? ECONOMY_CONFIG.bonusTanuki.defaultRareAvatarChance,
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
    xp: (progress.xp || 0) + reward.xp,
    coins: (progress.coins || 0) + reward.coins,
    lifetimeCoins: (progress.lifetimeCoins || 0) + reward.coins,
    energy: (progress.energy || 0) + reward.energy,
    lastEnergyAt:
      (progress.energy || 0) + reward.energy >=
      (progress.maxEnergy || ECONOMY_CONFIG.energy.baseEnergy)
        ? Date.now()
        : progress.lastEnergyAt,
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
