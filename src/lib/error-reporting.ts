import Constants from "expo-constants";
import { Platform } from "react-native";

let sentry: any | null | undefined;

function sentryDsn() {
  return process.env.EXPO_PUBLIC_SENTRY_DSN || "";
}

function loadSentry() {
  if (sentry !== undefined) return sentry;

  try {
    sentry = require("@sentry/react-native");
  } catch {
    sentry = null;
  }

  return sentry;
}

export function initErrorReporting() {
  const dsn = sentryDsn();
  const Sentry = loadSentry();

  if (!Sentry || !dsn) {
    if (__DEV__) {
      console.log("[error-reporting] Sentry disabled", {
        hasModule: Boolean(Sentry),
        hasDsn: Boolean(dsn),
      });
    }

    return;
  }

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    debug: __DEV__,
    environment: __DEV__ ? "development" : "production",
    release:
      Constants.expoConfig?.version ||
      Constants.nativeAppVersion ||
      "development",
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    profilesSampleRate: __DEV__ ? 1.0 : 0.05,
    attachScreenshot: true,
    attachStacktrace: true,
    enableAutoSessionTracking: true,
    enableNativeCrashHandling: true,
  });

  Sentry.setContext("app", {
    name: "Hidden Tanuki",
    version: Constants.expoConfig?.version || Constants.nativeAppVersion,
    platform: Platform.OS,
    expoRuntimeVersion: Constants.expoConfig?.runtimeVersion,
  });

  if (__DEV__) {
    console.log("[error-reporting] Sentry initialized");
  }
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>
) {
  const Sentry = loadSentry();

  if (__DEV__) {
    console.log("[captured-error]", {
      error,
      context,
    });
  }

  if (!Sentry || !sentryDsn()) return;

  Sentry.withScope((scope: any) => {
    if (context) {
      scope.setContext("context", context);
    }

    Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string,
  context?: Record<string, unknown>
) {
  const Sentry = loadSentry();

  if (__DEV__) {
    console.log("[captured-message]", {
      message,
      context,
    });
  }

  if (!Sentry || !sentryDsn()) return;

  Sentry.withScope((scope: any) => {
    if (context) {
      scope.setContext("context", context);
    }

    Sentry.captureMessage(message);
  });
}

export function setErrorUser(user?: {
  id?: string | null;
  email?: string | null;
  username?: string | null;
}) {
  const Sentry = loadSentry();

  if (!Sentry || !sentryDsn()) return;

  if (!user?.id && !user?.email && !user?.username) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id || undefined,
    email: user.email || undefined,
    username: user.username || undefined,
  });
}

export function errorReportingDebugInfo() {
  return {
    hasDsn: Boolean(sentryDsn()),
    moduleAvailable: Boolean(loadSentry()),
    environment: __DEV__ ? "development" : "production",
  };
}
