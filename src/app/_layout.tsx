import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth-context";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadGameAudio, startMusic } from "@/lib/audio";
import { loadSettings } from "@/lib/game-settings";
import { seedPuzzleDbIfNeeded } from "@/lib/puzzle-db";

export default function RootLayout() {
  useEffect(() => {
    async function startAppAudio() {
      const settings = await loadSettings();

      await seedPuzzleDbIfNeeded();
      await loadGameAudio();
      await startMusic(settings);
    }

    startAppAudio();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="play" />
          <Stack.Screen name="chapter-intro" />
          <Stack.Screen name="chapter-complete" />
          <Stack.Screen name="chapter-map" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="dev-tools" />
            <Stack.Screen name="account" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="collections" />
          <Stack.Screen name="chapters" />
          <Stack.Screen name="chapter-detail" />
          <Stack.Screen name="restore" />
          <Stack.Screen name="bonus-tanuki" />
          <Stack.Screen name="collection-play" />
          <Stack.Screen name="avatar-shop" />
          <Stack.Screen name="lootboxes" />
          <Stack.Screen name="skill-tree" />
          <Stack.Screen name="titles" />
          <Stack.Screen name="mastery" />
          <Stack.Screen name="energy-shop" />
          <Stack.Screen name="event" />
          <Stack.Screen name="missions" />
          <Stack.Screen name="hub" />
          <Stack.Screen name="db-status" />
          </Stack>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
