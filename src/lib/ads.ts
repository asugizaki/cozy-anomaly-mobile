import { Alert, Platform } from "react-native";
import { trackAnalyticsEvent } from "./analytics";

const TEST_REWARDED_ANDROID = "ca-app-pub-3940256099942544/5224354917";
const TEST_REWARDED_IOS = "ca-app-pub-3940256099942544/1712485313";

const PROD_REWARDED_ANDROID =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID || "";
const PROD_REWARDED_IOS =
  process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID || "";

const USE_TEST_ADS =
  process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS !== "false" || __DEV__;

type RewardedAdContext =
  | "hint"
  | "energy_refill"
  | "daily_gift_multiplier"
  | "restoration_multiplier"
  | "bonus_tanuki_multiplier"
  | "chapter_complete_multiplier"
  | "test";

type RewardedAdResult = {
  success: boolean;
  source: "admob" | "dev_placeholder" | "unavailable";
  message: string;
};

let initialized = false;
let mobileAdsModule: any | undefined;

function rewardedUnitId() {
  if (USE_TEST_ADS) {
    return Platform.OS === "ios" ? TEST_REWARDED_IOS : TEST_REWARDED_ANDROID;
  }

  return Platform.OS === "ios" ? PROD_REWARDED_IOS : PROD_REWARDED_ANDROID;
}

function loadAdMobModule() {
  if (mobileAdsModule !== undefined) return mobileAdsModule;

  try {
    // Dynamic require keeps Expo Go from crashing before you create a dev build.
    // The native module only works in a custom dev build / production build.
    mobileAdsModule = require("react-native-google-mobile-ads");
  } catch {
    mobileAdsModule = null;
  }

  return mobileAdsModule;
}

export async function initAds() {
  if (initialized) return;
  initialized = true;

  const admob = loadAdMobModule();

  if (!admob?.default) {
    if (__DEV__) {
      console.log("[ads] react-native-google-mobile-ads unavailable. Using dev placeholder.");
    }
    return;
  }

  try {
    await admob.default().initialize();
    console.log("[ads] initialized", {
      useTestAds: USE_TEST_ADS,
      rewardedUnitId: rewardedUnitId(),
    });
  } catch (error) {
    console.log("[ads] init failed", error);
  }
}

function showDevPlaceholder(context: RewardedAdContext) {
  return new Promise<RewardedAdResult>((resolve) => {
    Alert.alert(
      "Rewarded Ad Test",
      "AdMob is not available in Expo Go.\n\nThis dev placeholder simulates a completed rewarded ad. Use a custom dev build to test real AdMob.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () =>
            resolve({
              success: false,
              source: "dev_placeholder",
              message: "Ad cancelled.",
            }),
        },
        {
          text: "Simulate Watched",
          onPress: () =>
            resolve({
              success: true,
              source: "dev_placeholder",
              message: "Simulated rewarded ad complete.",
            }),
        },
      ]
    );
  });
}

export async function showRewardedAd(
  context: RewardedAdContext
): Promise<RewardedAdResult> {
  await initAds();

  const unitId = rewardedUnitId();

  if (!unitId) {
    await trackAnalyticsEvent("ad_rewarded_unavailable", {
      context,
      reason: "missing_unit_id",
    });

    return {
      success: false,
      source: "unavailable",
      message: "Rewarded ad unit ID is missing.",
    };
  }

  const admob = loadAdMobModule();

  if (!admob?.RewardedAd || !admob?.RewardedAdEventType || !admob?.AdEventType) {
    const result = await showDevPlaceholder(context);

    await trackAnalyticsEvent(
      result.success ? "ad_rewarded_earned" : "ad_rewarded_closed",
      {
        context,
        source: result.source,
      }
    );

    return result;
  }

  const {
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    TestIds,
  } = admob;

  const adUnitId = USE_TEST_ADS ? TestIds.REWARDED : unitId;
  const rewarded = RewardedAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise<RewardedAdResult>((resolve) => {
    let resolved = false;
    let earnedReward = false;

    const cleanupFns: Array<() => void> = [];

    function finish(result: RewardedAdResult) {
      if (resolved) return;
      resolved = true;
      cleanupFns.forEach((cleanup) => cleanup());
      resolve(result);
    }

    cleanupFns.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        trackAnalyticsEvent("ad_rewarded_loaded", {
          context,
          adUnitId,
          useTestAds: USE_TEST_ADS,
        });

        rewarded.show();
      })
    );

    cleanupFns.push(
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earnedReward = true;

        trackAnalyticsEvent("ad_rewarded_earned", {
          context,
          adUnitId,
          useTestAds: USE_TEST_ADS,
        });
      })
    );

    cleanupFns.push(
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        trackAnalyticsEvent("ad_rewarded_closed", {
          context,
          earnedReward,
          adUnitId,
          useTestAds: USE_TEST_ADS,
        });

        finish({
          success: earnedReward,
          source: "admob",
          message: earnedReward
            ? "Rewarded ad complete."
            : "Ad closed before reward was earned.",
        });
      })
    );

    cleanupFns.push(
      rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
        trackAnalyticsEvent("ad_rewarded_failed_to_load", {
          context,
          adUnitId,
          useTestAds: USE_TEST_ADS,
          error: String(error?.message || error || "unknown"),
        });

        finish({
          success: false,
          source: "admob",
          message: String(error?.message || "Rewarded ad failed to load."),
        });
      })
    );

    trackAnalyticsEvent("ad_rewarded_shown", {
      context,
      adUnitId,
      useTestAds: USE_TEST_ADS,
    });

    rewarded.load();

    setTimeout(() => {
      finish({
        success: false,
        source: "admob",
        message: "Rewarded ad timed out.",
      });
    }, 30000);
  });
}

export function admobDebugInfo() {
  return {
    initialized,
    useTestAds: USE_TEST_ADS,
    unitId: rewardedUnitId(),
    moduleAvailable: Boolean(loadAdMobModule()),
  };
}
