import { loadProgress, PlayerProgress, saveProgress } from "./player-progress";

export const ENERGY_RECHARGE_MINUTES = 12;
export const ENERGY_PER_PLAY = 1;
export const AD_ENERGY_REWARD = 5;
export const MAX_DAILY_ENERGY_ADS = 3;

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function applyEnergyRecharge(progress: PlayerProgress): PlayerProgress {
  const now = Date.now();
  const maxEnergy = progress.maxEnergy || 20;

  if ((progress.energy || 0) >= maxEnergy) {
    return {
      ...progress,
      energy: maxEnergy,
      lastEnergyAt: now,
    };
  }

  const lastEnergyAt = progress.lastEnergyAt || now;
  const elapsedMs = Math.max(0, now - lastEnergyAt);
  const rechargeMs = ENERGY_RECHARGE_MINUTES * 60 * 1000;
  const gained = Math.floor(elapsedMs / rechargeMs);

  if (gained <= 0) {
    return progress;
  }

  const nextEnergy = Math.min(maxEnergy, (progress.energy || 0) + gained);
  const consumedMs = gained * rechargeMs;

  return {
    ...progress,
    energy: nextEnergy,
    lastEnergyAt: nextEnergy >= maxEnergy ? now : lastEnergyAt + consumedMs,
  };
}

export function secondsUntilNextEnergy(progress: PlayerProgress) {
  const charged = applyEnergyRecharge(progress);

  if (charged.energy >= charged.maxEnergy) {
    return 0;
  }

  const rechargeMs = ENERGY_RECHARGE_MINUTES * 60 * 1000;
  const elapsed = Date.now() - charged.lastEnergyAt;
  const remaining = rechargeMs - elapsed;

  return Math.max(0, Math.ceil(remaining / 1000));
}

export async function loadProgressWithEnergy() {
  const progress = await loadProgress();
  const charged = applyEnergyRecharge(progress);

  if (
    charged.energy !== progress.energy ||
    charged.lastEnergyAt !== progress.lastEnergyAt
  ) {
    await saveProgress(charged);
  }

  return charged;
}

export async function spendEnergy(amount = ENERGY_PER_PLAY) {
  const progress = await loadProgressWithEnergy();

  if ((progress.energy || 0) < amount) {
    return {
      success: false,
      progress,
      message: "Not enough energy.",
    };
  }

  const updated: PlayerProgress = {
    ...progress,
    energy: progress.energy - amount,
    totalEnergySpent: (progress.totalEnergySpent || 0) + amount,
    energySpentToday: (progress.energySpentToday || 0) + amount,
    lastEnergyAt:
      progress.energy >= progress.maxEnergy ? Date.now() : progress.lastEnergyAt,
  };

  await saveProgress(updated);

  return {
    success: true,
    progress: updated,
    message: "Energy spent.",
  };
}

export async function watchAdForEnergy() {
  const progress = await loadProgressWithEnergy();
  const today = todayKey();

  const viewsToday =
    progress.energyAdViewsDate === today ? progress.energyAdViewsToday || 0 : 0;

  if ((progress.energy || 0) > 0) {
    return {
      success: false,
      progress,
      message: "Energy ad refills are only available when energy is empty.",
    };
  }

  if (viewsToday >= MAX_DAILY_ENERGY_ADS) {
    return {
      success: false,
      progress,
      message: "Daily energy ad limit reached.",
    };
  }

  const gained = Math.min(AD_ENERGY_REWARD, progress.maxEnergy - progress.energy);

  const updated: PlayerProgress = {
    ...progress,
    energy: Math.min(progress.maxEnergy, progress.energy + AD_ENERGY_REWARD),
    energyAdViewsDate: today,
    energyAdViewsToday: viewsToday + 1,
    totalEnergyFromAds: (progress.totalEnergyFromAds || 0) + gained,
    adEnergyRefillsToday: (progress.adEnergyRefillsToday || 0) + 1,
    lastEnergyAt: Date.now(),
  };

  await saveProgress(updated);

  return {
    success: true,
    progress: updated,
    message: `+${gained} energy added.`,
  };
}

export async function buyEnergyPack(amount: number, cost: number) {
  const progress = await loadProgressWithEnergy();

  if ((progress.coins || 0) < cost) {
    return {
      success: false,
      progress,
      message: `You need ${cost} coins.`,
    };
  }

  const updated: PlayerProgress = {
    ...progress,
    coins: progress.coins - cost,
    energy: Math.min(progress.maxEnergy, progress.energy + amount),
    lastEnergyAt: Date.now(),
  };

  await saveProgress(updated);

  return {
    success: true,
    progress: updated,
    message: `+${amount} energy purchased.`,
  };
}
