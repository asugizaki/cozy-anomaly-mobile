import { ECONOMY_CONFIG } from "./economy-config";
import { loadProgress, PlayerProgress, saveProgress } from "./player-progress";
import {
  buyEnergyPackServerCall,
  spendEnergyServerCall,
  watchAdForEnergyServerCall,
} from "./server-economy";

export const ENERGY_RECHARGE_MINUTES = ECONOMY_CONFIG.energy.rechargeMinutes;
export const ENERGY_PER_PLAY = ECONOMY_CONFIG.energy.energyPerPlay;
export const AD_ENERGY_REWARD = ECONOMY_CONFIG.energy.adEnergyReward;
export const MAX_DAILY_ENERGY_ADS = ECONOMY_CONFIG.energy.maxDailyEnergyAds;

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function baseEnergyCap(progress: PlayerProgress) {
  return progress.maxEnergy || ECONOMY_CONFIG.energy.baseEnergy;
}

function shouldRechargeEnergy(progress: PlayerProgress) {
  return (progress.energy || 0) < baseEnergyCap(progress);
}

function lastEnergyAtAfterEnergyChange(previous: PlayerProgress, nextEnergy: number) {
  const cap = baseEnergyCap(previous);

  // At or above base cap, refill timer is paused/reset.
  // When energy later drops below cap, spendEnergy starts a fresh timer.
  if (nextEnergy >= cap) return Date.now();

  const previousEnergy = previous.energy || 0;

  if (previousEnergy >= cap && nextEnergy < cap) {
    return Date.now();
  }

  return previous.lastEnergyAt || Date.now();
}

export function applyEnergyRecharge(progress: PlayerProgress): PlayerProgress {
  const now = Date.now();
  const maxEnergy = progress.maxEnergy || 20;

  if ((progress.energy || 0) >= maxEnergy) {
    return {
      ...progress,
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
  const maxEnergy = baseEnergyCap(charged);

  if ((charged.energy || 0) >= maxEnergy) {
    return 0;
  }

  const rechargeMs = ENERGY_RECHARGE_MINUTES * 60 * 1000;
  const elapsed = Date.now() - (charged.lastEnergyAt || Date.now());
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

  try {
    const serverResult = await spendEnergyServerCall(progress, amount);

    if (serverResult) {
      return serverResult;
    }
  } catch (error) {
    return {
      success: false,
      progress,
      message:
        error instanceof Error ? error.message : "Could not spend energy.",
    };
  }

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
    lastEnergyAt: lastEnergyAtAfterEnergyChange(progress, progress.energy - amount),
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

  try {
    const serverResult = await watchAdForEnergyServerCall(progress);

    if (serverResult) {
      return serverResult;
    }
  } catch (error) {
    return {
      success: false,
      progress,
      message:
        error instanceof Error
          ? error.message
          : "Could not refill energy.",
    };
  }

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

  const nextEnergy = (progress.energy || 0) + AD_ENERGY_REWARD;
  const gained = AD_ENERGY_REWARD;

  const updated: PlayerProgress = {
    ...progress,
    energy: nextEnergy,
    energyAdViewsDate: today,
    energyAdViewsToday: viewsToday + 1,
    totalEnergyFromAds: (progress.totalEnergyFromAds || 0) + gained,
    adEnergyRefillsToday: (progress.adEnergyRefillsToday || 0) + 1,
    lastEnergyAt: lastEnergyAtAfterEnergyChange(progress, nextEnergy),
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

  try {
    const serverResult = await buyEnergyPackServerCall(
      progress,
      amount,
      cost
    );

    if (serverResult) {
      return serverResult;
    }
  } catch (error) {
    return {
      success: false,
      progress,
      message:
        error instanceof Error
          ? error.message
          : "Could not buy energy pack.",
    };
  }

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
    energy: (progress.energy || 0) + amount,
    lastEnergyAt: lastEnergyAtAfterEnergyChange(progress, (progress.energy || 0) + amount),
  };

  await saveProgress(updated);

  return {
    success: true,
    progress: updated,
    message: `+${amount} energy purchased.`,
  };
}
