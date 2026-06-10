import { trackAnalyticsEvent } from "./analytics";
import { showRewardedAd } from "./ads";
import { loadProgress, saveProgress } from "./player-progress";

export type MultiplierReward = {
  xp?: number;
  coins?: number;
  energy?: number;
  lootBoxes?: number;
  skillPoints?: number;
};

export type RewardMultiplierSource =
  | "daily_gift"
  | "restoration"
  | "bonus_tanuki"
  | "chapter_complete";

export function rewardSummary(reward: MultiplierReward) {
  const parts: string[] = [];

  if (reward.xp) parts.push(`+${reward.xp} XP`);
  if (reward.coins) parts.push(`+${reward.coins} coins`);
  if (reward.energy) parts.push(`+${reward.energy} energy`);
  if (reward.lootBoxes) parts.push(`+${reward.lootBoxes} crate${reward.lootBoxes > 1 ? "s" : ""}`);
  if (reward.skillPoints) parts.push(`+${reward.skillPoints} skill point${reward.skillPoints > 1 ? "s" : ""}`);

  return parts.join(" · ");
}

function adContextForSource(source: RewardMultiplierSource) {
  if (source === "daily_gift") return "daily_gift_multiplier";
  if (source === "restoration") return "restoration_multiplier";
  if (source === "bonus_tanuki") return "bonus_tanuki_multiplier";
  return "chapter_complete_multiplier";
}

export async function grantRewardMultiplier(options: {
  source: RewardMultiplierSource;
  reward: MultiplierReward;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  await trackAnalyticsEvent("reward_multiplier_shown", {
    source: options.source,
    ...(options.metadata || {}),
  });

  const adResult = await showRewardedAd(adContextForSource(options.source));

  if (!adResult.success) {
    await trackAnalyticsEvent("reward_multiplier_declined", {
      source: options.source,
      reason: adResult.message,
      adSource: adResult.source,
      ...(options.metadata || {}),
    });

    return {
      success: false,
      progress: await loadProgress(),
      message: adResult.message,
    };
  }

  const progress = await loadProgress();
  const reward = options.reward;
  const nextEnergy = (progress.energy || 0) + (reward.energy || 0);

  const updated = {
    ...progress,
    xp: (progress.xp || 0) + (reward.xp || 0),
    coins: (progress.coins || 0) + (reward.coins || 0),
    lifetimeCoins: (progress.lifetimeCoins || 0) + (reward.coins || 0),
    energy: nextEnergy,
    lootBoxes: (progress.lootBoxes || 0) + (reward.lootBoxes || 0),
    skillPoints: (progress.skillPoints || 0) + (reward.skillPoints || 0),
    lastEnergyAt:
      nextEnergy >= (progress.maxEnergy || 20)
        ? Date.now()
        : progress.lastEnergyAt,
  };

  await saveProgress(updated);

  await trackAnalyticsEvent("reward_multiplier_accepted", {
    source: options.source,
    adSource: adResult.source,
    xp: reward.xp || 0,
    coins: reward.coins || 0,
    energy: reward.energy || 0,
    lootBoxes: reward.lootBoxes || 0,
    skillPoints: reward.skillPoints || 0,
    ...(options.metadata || {}),
  });

  return {
    success: true,
    progress: updated,
    message: rewardSummary(reward),
  };
}
