// Firebase Crashlytics integration wrapper

export async function initCrashlytics() {
  console.log("[crashlytics] initialize here after installing @react-native-firebase/crashlytics");
}

export async function recordError(error: unknown, context?: Record<string, unknown>) {
  console.log("[crashlytics] error", error, context);
}

export async function logEvent(message: string) {
  console.log("[crashlytics]", message);
}
