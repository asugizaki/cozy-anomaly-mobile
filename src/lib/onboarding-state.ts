import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "pon_onboarding_completed_v1";

export async function hasCompletedPonOnboarding() {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
}

export async function completePonOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function resetPonOnboardingForTesting() {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}
