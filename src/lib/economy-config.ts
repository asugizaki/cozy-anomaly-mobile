import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, firestore } from "./firebase";

export const DEFAULT_ECONOMY_CONFIG = {
  version: 1,

  remote: {
    enabled: true,
    firestorePath: "gameConfig/economy",
    cacheKey: "remote_economy_config_v1",
    cacheTtlMs: 6 * 60 * 60 * 1000,
  },

  energy: {
    baseEnergy: 20,
    energyPerPlay: 1,
    rechargeMinutes: 20,
    adEnergyReward: 5,
    maxDailyEnergyAds: 5,
  },

  puzzleRewards: {
    xpByDifficulty: {
      easy: 8,
      medium: 16,
      hard: 30,
    },
    coinsByDifficulty: {
      easy: 1,
      medium: 2,
      hard: 4,
    },
    perfectBonusXp: 4,
    perfectBonusCoins: 1,
    noHintBonusXp: 3,
    dailyBonusXp: 8,
    dailyBonusCoins: 2,
    collectionCompleteXp: 30,
    collectionCompleteCoins: 5,
    collectionCompleteLootBoxes: 0,
    replayMultiplier: 0.1,
  },

  bonusTanuki: {
    defaultXp: 60,
    defaultCoins: 20,
    defaultEnergy: 1,
    defaultLootBoxChance: 0.03,
    defaultRareAvatarChance: 0.01,
  },

  missions: {
    dailySolve5: { xp: 25, coins: 10 },
    dailyPerfect1: { xp: 20, coins: 8 },
    dailySpendEnergy10: { coins: 15, energy: 1 },
    dailyAdEnergy1: { xp: 15, coins: 5 },
    dailyCarefulPlay: { xp: 20, lootBoxes: 0 },
  },

  events: {
    solve25: { xp: 120, coins: 50 },
    perfect10: { coins: 75, lootBoxes: 0 },
    spendEnergy40: { xp: 140, energy: 3 },
    openCrates3: { lootBoxes: 1, coins: 25 },
  },

  lootBoxes: {
    basePrice: 500,
    commonCoinRewards: [15, 20, 30],
    rareCoinRewards: [50, 75, 100],
    epicCoinRewards: [150, 200, 250],
    commonDuplicateCoins: 20,
    rareDuplicateCoins: 60,
    epicDuplicateCoins: 150,
  },

  skills: {
    xpBoost1: 0.05,
    xpBoost2: 0.1,
    coinBoost1: 0.05,
    coinBoost2: 0.1,
    crateDiscount1: 0.05,
    crateDiscount2: 0.1,
    dailyBonusXp: 5,
    perfectBonusCoins: 2,
  },
} as const;

export type EconomyConfig = typeof DEFAULT_ECONOMY_CONFIG;

// Existing reward code imports ECONOMY_CONFIG synchronously.
// Keep the same object reference and mutate it after remote fetch.
export const ECONOMY_CONFIG: EconomyConfig = JSON.parse(
  JSON.stringify(DEFAULT_ECONOMY_CONFIG)
);

type RemoteCache = {
  fetchedAt: number;
  data: Partial<EconomyConfig>;
};

let initialized = false;
let lastError: string | undefined;
let lastFetchAt: number | undefined;
let lastSource: "defaults" | "cache" | "firestore" = "defaults";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMergeMutable(target: any, source: any) {
  if (!isPlainObject(source)) return target;

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      target[key] = [...value];
    } else if (isPlainObject(value)) {
      if (!isPlainObject(target[key])) {
        target[key] = {};
      }

      deepMergeMutable(target[key], value);
    } else {
      target[key] = value;
    }
  }

  return target;
}

function resetToDefaults() {
  deepMergeMutable(
    ECONOMY_CONFIG,
    JSON.parse(JSON.stringify(DEFAULT_ECONOMY_CONFIG))
  );
}

function sanitizeRemoteConfig(data: any): Partial<EconomyConfig> {
  if (!isPlainObject(data)) return {};

  return data as Partial<EconomyConfig>;
}

async function readCachedRemoteConfig() {
  const raw = await AsyncStorage.getItem(ECONOMY_CONFIG.remote.cacheKey);

  if (!raw) return undefined;

  const parsed = JSON.parse(raw) as RemoteCache;

  if (
    !parsed?.fetchedAt ||
    Date.now() - parsed.fetchedAt > ECONOMY_CONFIG.remote.cacheTtlMs
  ) {
    return undefined;
  }

  return parsed;
}

async function writeCachedRemoteConfig(data: Partial<EconomyConfig>) {
  const payload: RemoteCache = {
    fetchedAt: Date.now(),
    data,
  };

  await AsyncStorage.setItem(
    ECONOMY_CONFIG.remote.cacheKey,
    JSON.stringify(payload)
  );
}

export function getEconomyConfigStatus() {
  return {
    initialized,
    lastError,
    lastFetchAt,
    lastSource,
    firestorePath: ECONOMY_CONFIG.remote.firestorePath,
  };
}

export async function initRemoteEconomyConfig(options?: {
  forceRefresh?: boolean;
}) {
  if (initialized && !options?.forceRefresh) {
    return ECONOMY_CONFIG;
  }

  initialized = true;
  lastError = undefined;

  resetToDefaults();

  try {
    if (!options?.forceRefresh) {
      const cached = await readCachedRemoteConfig();

      if (cached?.data) {
        deepMergeMutable(ECONOMY_CONFIG, sanitizeRemoteConfig(cached.data));
        lastFetchAt = cached.fetchedAt;
        lastSource = "cache";
      }
    }
  } catch (error) {
    lastError =
      error instanceof Error ? error.message : "Could not read economy cache.";
  }

  if (!ECONOMY_CONFIG.remote.enabled || !firebaseConfigured()) {
    return ECONOMY_CONFIG;
  }

  try {
    const [collectionName, documentId] =
      ECONOMY_CONFIG.remote.firestorePath.split("/");

    const snapshot = await getDoc(doc(firestore, collectionName, documentId));

    if (snapshot.exists()) {
      const remoteData = sanitizeRemoteConfig(snapshot.data());

      resetToDefaults();
      deepMergeMutable(ECONOMY_CONFIG, remoteData);

      await writeCachedRemoteConfig(remoteData);

      lastFetchAt = Date.now();
      lastSource = "firestore";
    }
  } catch (error) {
    lastError =
      error instanceof Error ? error.message : "Could not fetch economy config.";
  }

  if (__DEV__) {
    console.log("[economy-config]", {
      status: getEconomyConfigStatus(),
      config: ECONOMY_CONFIG,
    });
  }

  return ECONOMY_CONFIG;
}

export async function refreshRemoteEconomyConfig() {
  initialized = false;

  return initRemoteEconomyConfig({
    forceRefresh: true,
  });
}
