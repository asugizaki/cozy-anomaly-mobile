import { Platform } from "react-native";
import { trackAnalyticsEvent } from "./analytics";
import { loadProgress, saveProgress } from "./player-progress";

export const REVENUECAT_ENTITLEMENTS = {
  removeAds: "remove_ads",
} as const;

export const REVENUECAT_PRODUCTS = {
  starterPack: "hidden_tanuki_starter_pack",
  energySmall: "hidden_tanuki_energy_small",
  energyMedium: "hidden_tanuki_energy_medium",
  energyLarge: "hidden_tanuki_energy_large",
  removeAds: "hidden_tanuki_remove_ads",
} as const;

type PurchaseResult = {
  success: boolean;
  message: string;
  progress?: any;
  customerInfo?: any;
};

let purchasesModule: any | null | undefined;
let initialized = false;

function revenueCatApiKey() {
  return Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || ""
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";
}

function loadPurchasesModule() {
  if (purchasesModule !== undefined) return purchasesModule;

  try {
    purchasesModule = require("react-native-purchases").default;
  } catch {
    purchasesModule = null;
  }

  return purchasesModule;
}

export function revenueCatAvailable() {
  return Boolean(loadPurchasesModule() && revenueCatApiKey());
}

export async function initRevenueCat(userId?: string | null) {
  if (initialized) return;

  const Purchases = loadPurchasesModule();
  const apiKey = revenueCatApiKey();

  if (!Purchases || !apiKey) {
    if (__DEV__) {
      console.log("[revenuecat] unavailable", {
        hasModule: Boolean(Purchases),
        hasApiKey: Boolean(apiKey),
      });
    }

    return;
  }

  Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.WARN);

  await Purchases.configure({
    apiKey,
    appUserID: userId || undefined,
  });

  initialized = true;

  await trackAnalyticsEvent("revenuecat_initialized", {
    platform: Platform.OS,
  });
}

export async function identifyRevenueCatUser(userId?: string | null) {
  const Purchases = loadPurchasesModule();

  if (!Purchases || !userId) return;

  await initRevenueCat(userId);

  try {
    await Purchases.logIn(userId);
  } catch (error) {
    if (__DEV__) console.log("[revenuecat] login failed", error);
  }
}

export async function getRevenueCatOfferings() {
  const Purchases = loadPurchasesModule();

  if (!Purchases || !revenueCatApiKey()) {
    return {
      current: null,
      availablePackages: [],
      unavailableReason: "RevenueCat is not available in Expo Go or API key is missing.",
    };
  }

  await initRevenueCat();

  const offerings = await Purchases.getOfferings();

  return {
    current: offerings.current || null,
    availablePackages: offerings.current?.availablePackages || [],
  };
}

function rewardForProduct(productId: string) {
  if (productId === REVENUECAT_PRODUCTS.starterPack) {
    return { coins: 500, energy: 50, lootBoxes: 3 };
  }

  if (productId === REVENUECAT_PRODUCTS.energySmall) {
    return { energy: 25 };
  }

  if (productId === REVENUECAT_PRODUCTS.energyMedium) {
    return { energy: 100 };
  }

  if (productId === REVENUECAT_PRODUCTS.energyLarge) {
    return { energy: 250 };
  }

  return {};
}

async function grantConsumableReward(productId: string) {
  const reward = rewardForProduct(productId);
  const progress = await loadProgress();
  const nextEnergy = (progress.energy || 0) + (reward.energy || 0);

  const updated = {
    ...progress,
    coins: (progress.coins || 0) + (reward.coins || 0),
    lifetimeCoins: (progress.lifetimeCoins || 0) + (reward.coins || 0),
    energy: nextEnergy,
    lootBoxes: (progress.lootBoxes || 0) + (reward.lootBoxes || 0),
    lastEnergyAt:
      nextEnergy >= (progress.maxEnergy || 20)
        ? Date.now()
        : progress.lastEnergyAt,
  };

  await saveProgress(updated);

  return {
    progress: updated,
    reward,
  };
}

export async function purchaseRevenueCatPackage(pkg: any): Promise<PurchaseResult> {
  const Purchases = loadPurchasesModule();

  if (!Purchases || !revenueCatApiKey()) {
    return {
      success: false,
      message:
        "RevenueCat is not available in Expo Go. Use a custom dev build to test purchases.",
    };
  }

  await initRevenueCat();

  const productId =
    pkg?.product?.identifier ||
    pkg?.identifier ||
    pkg?.productIdentifier ||
    "";

  try {
    await trackAnalyticsEvent("purchase_started", {
      productId,
    });

    const result = await Purchases.purchasePackage(pkg);
    const customerInfo = result.customerInfo;

    if (productId === REVENUECAT_PRODUCTS.removeAds) {
      await trackAnalyticsEvent("purchase_completed", {
        productId,
        entitlement: REVENUECAT_ENTITLEMENTS.removeAds,
      });

      return {
        success: true,
        message: "Ads removed. Thank you for supporting Hidden Tanuki!",
        customerInfo,
      };
    }

    const granted = await grantConsumableReward(productId);

    await trackAnalyticsEvent("purchase_completed", {
      productId,
      coins: granted.reward.coins || 0,
      energy: granted.reward.energy || 0,
      lootBoxes: granted.reward.lootBoxes || 0,
    });

    return {
      success: true,
      message: "Purchase complete. Rewards added!",
      progress: granted.progress,
      customerInfo,
    };
  } catch (error: any) {
    if (error?.userCancelled) {
      await trackAnalyticsEvent("purchase_cancelled", {
        productId,
      });

      return {
        success: false,
        message: "Purchase cancelled.",
      };
    }

    await trackAnalyticsEvent("purchase_failed", {
      productId,
      error: String(error?.message || error || "unknown"),
    });

    return {
      success: false,
      message: String(error?.message || "Purchase failed."),
    };
  }
}

export async function restoreRevenueCatPurchases() {
  const Purchases = loadPurchasesModule();

  if (!Purchases || !revenueCatApiKey()) {
    return {
      success: false,
      message:
        "RevenueCat is not available in Expo Go. Use a custom dev build to restore purchases.",
    };
  }

  await initRevenueCat();

  try {
    const customerInfo = await Purchases.restorePurchases();

    await trackAnalyticsEvent("purchase_restored", {
      hasRemoveAds: Boolean(
        customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENTS.removeAds]
      ),
    });

    return {
      success: true,
      message: "Purchases restored.",
      customerInfo,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Restore failed.",
    };
  }
}

export async function hasRemoveAdsEntitlement() {
  const Purchases = loadPurchasesModule();

  if (!Purchases || !revenueCatApiKey()) return false;

  await initRevenueCat();

  const customerInfo = await Purchases.getCustomerInfo();

  return Boolean(
    customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENTS.removeAds]
  );
}
