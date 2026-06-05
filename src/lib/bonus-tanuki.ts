
import { loadProgress, saveProgress } from "./player-progress";

export async function claimBonusTanukiReward() {
  const progress = await loadProgress();

  if ((progress.bonusTanukiTickets || 0) <= 0) {
    return {
      success: false,
      message: "No bonus tickets available.",
      progress,
    };
  }

  const rareAvatarChance = Math.random() < 0.05;

  const reward = {
    xp: 200,
    coins: 250,
    lootBoxes: Math.random() < 0.25 ? 1 : 0,
    avatarUnlocked: rareAvatarChance ? "golden_tanuki" : undefined,
  };

  const unlockedAvatarIds = [...(progress.unlockedAvatarIds || [])];

  if (reward.avatarUnlocked && !unlockedAvatarIds.includes(reward.avatarUnlocked)) {
    unlockedAvatarIds.push(reward.avatarUnlocked);
  }

  const updated = {
    ...progress,
    bonusTanukiTickets: Math.max(0, (progress.bonusTanukiTickets || 0) - 1),
    xp: (progress.xp || 0) + reward.xp,
    coins: (progress.coins || 0) + reward.coins,
    lifetimeCoins: (progress.lifetimeCoins || 0) + reward.coins,
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
