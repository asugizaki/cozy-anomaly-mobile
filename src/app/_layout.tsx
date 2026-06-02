import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadGameAudio, startMusic } from "@/lib/audio";
import { loadSettings } from "@/lib/game-settings";

export default function RootLayout() {
  useEffect(() => {
    async function startAppAudio() {
      const settings = await loadSettings();

      await loadGameAudio();
      await startMusic(settings);
    }

    startAppAudio();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="play" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="collections" />
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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
