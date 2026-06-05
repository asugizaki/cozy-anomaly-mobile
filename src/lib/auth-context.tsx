import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from 'react-native';
import {
  downloadCloudSave,
  syncCloudSave,
  uploadCloudSave,
} from "./cloud-save";
import { firebaseAuth, firebaseConfigured } from "./firebase";
import { saveProgress } from "./player-progress";

WebBrowser.maybeCompleteAuthSession();

const LAST_SYNC_KEY = "cloud_save_last_sync_at";

type CloudSyncState = {
  syncing: boolean;
  lastSyncAt?: number;
  error?: string;
};

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  firebaseReady: boolean;
  cloudSync: CloudSyncState;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncNow: () => Promise<void>;
  uploadNow: () => Promise<void>;
  downloadNow: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseReady = firebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>({
    syncing: false,
  });

const googleAuthConfig = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  ...(Platform.OS === "ios" &&
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    ? {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      }
    : {}),
};

const [, response, promptAsync] = Google.useAuthRequest(googleAuthConfig);

  async function loadLastSync() {
    const raw = await AsyncStorage.getItem(LAST_SYNC_KEY);

    if (raw) {
      setCloudSync((current) => ({
        ...current,
        lastSyncAt: Number(raw),
      }));
    }
  }

  async function rememberSync() {
    const now = Date.now();

    await AsyncStorage.setItem(LAST_SYNC_KEY, String(now));

    setCloudSync((current) => ({
      ...current,
      lastSyncAt: now,
      error: undefined,
    }));
  }

  useEffect(() => {
    loadLastSync();

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    async function handleGoogleResponse() {
      if (response?.type !== "success") return;

      const idToken = response.authentication?.idToken;

      if (!idToken) {
        setCloudSync((current) => ({
          ...current,
          error: "Google sign-in did not return an ID token.",
        }));
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);

      await signInWithCredential(firebaseAuth, credential);
    }

    handleGoogleResponse();
  }, [response]);

  useEffect(() => {
    async function autoSync() {
      if (!user) return;

      try {
        setCloudSync((current) => ({
          ...current,
          syncing: true,
          error: undefined,
        }));

        await syncCloudSave(user.uid);
        await rememberSync();
      } catch (error) {
        setCloudSync((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "Cloud sync failed.",
        }));
      } finally {
        setCloudSync((current) => ({
          ...current,
          syncing: false,
        }));
      }
    }

    autoSync();
  }, [user?.uid]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseReady) {
      setCloudSync((current) => ({
        ...current,
        error: "Firebase environment variables are missing.",
      }));
      return;
    }

    await promptAsync();
  }, [firebaseReady, promptAsync]);

  const signOutUser = useCallback(async () => {
    await signOut(firebaseAuth);
  }, []);

  const syncNow = useCallback(async () => {
    if (!user) return;

    setCloudSync((current) => ({
      ...current,
      syncing: true,
      error: undefined,
    }));

    try {
      await syncCloudSave(user.uid);
      await rememberSync();
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Cloud sync failed.",
      }));
    } finally {
      setCloudSync((current) => ({
        ...current,
        syncing: false,
      }));
    }
  }, [user?.uid]);

  const uploadNow = useCallback(async () => {
    if (!user) return;

    setCloudSync((current) => ({
      ...current,
      syncing: true,
      error: undefined,
    }));

    try {
      await uploadCloudSave(user.uid);
      await rememberSync();
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Upload failed.",
      }));
    } finally {
      setCloudSync((current) => ({
        ...current,
        syncing: false,
      }));
    }
  }, [user?.uid]);

  const downloadNow = useCallback(async () => {
    if (!user) return;

    setCloudSync((current) => ({
      ...current,
      syncing: true,
      error: undefined,
    }));

    try {
      const remote = await downloadCloudSave(user.uid);

      if (remote) {
        await saveProgress(remote);
      }

      await rememberSync();
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Download failed.",
      }));
    } finally {
      setCloudSync((current) => ({
        ...current,
        syncing: false,
      }));
    }
  }, [user?.uid]);

  const value = useMemo(
    () => ({
      user,
      initializing,
      firebaseReady,
      cloudSync,
      signInWithGoogle,
      signOutUser,
      syncNow,
      uploadNow,
      downloadNow,
    }),
    [
      user,
      initializing,
      firebaseReady,
      cloudSync,
      signInWithGoogle,
      signOutUser,
      syncNow,
      uploadNow,
      downloadNow,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}
