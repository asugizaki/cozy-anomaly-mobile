import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="play" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="collections" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="recent" />
        <Stack.Screen name="collection-play" />
        <Stack.Screen name="avatar-shop" />
        <Stack.Screen name="lootboxes" />
        <Stack.Screen name="skill-tree" />
        <Stack.Screen name="titles" />
        <Stack.Screen name="mastery" />
      </Stack>
    </SafeAreaProvider>
  );
}
