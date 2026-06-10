import { completePonOnboarding } from "@/lib/onboarding-state";
import { nextRouteForChapter } from "@/lib/chapters";
import { loadProgressWithEnergy } from "@/lib/energy";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  {
    title: "Welcome to Tanuki Town",
    body: "I'm Pon! This town is full of cozy cafes, shops, gardens, and hidden little mysteries.",
    emoji: "🦝",
  },
  {
    title: "Find the anomaly",
    body: "Each puzzle has one thing that looks different. Tap it to earn progress.",
    emoji: "🔎",
  },
  {
    title: "Restore each location",
    body: "Every 20 puzzles, we'll restore part of the chapter. Each chapter has 100 puzzles and 5 restorations.",
    emoji: "✨",
  },
  {
    title: "Follow the town map",
    body: "Finish a chapter to unlock the next place. Little by little, we'll bring Tanuki Town back to life.",
    emoji: "🗺️",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  async function next() {
    if (index < STEPS.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    await completePonOnboarding();
    const progress = await loadProgressWithEnergy();
    router.replace(nextRouteForChapter(progress) as any);
  }

  async function skip() {
    await completePonOnboarding();
    router.replace("/" as any);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>

        <View style={styles.dots}>
          {STEPS.map((item, dotIndex) => (
            <View
              key={item.title}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonText}>
            {index === STEPS.length - 1 ? "Start Restoring" : "Next"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={skip}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
    backgroundColor: "#FFF3E2",
  },

  card: {
    padding: 22,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
  },

  emoji: {
    fontSize: 74,
  },

  title: {
    marginTop: 10,
    fontSize: 30,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  body: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
    color: "#7B5A43",
    textAlign: "center",
  },

  dots: {
    marginTop: 22,
    flexDirection: "row",
    gap: 8,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: "#F4D7C4",
  },

  dotActive: {
    width: 26,
    backgroundColor: "#FF5C8A",
  },

  primaryButton: {
    marginTop: 24,
    alignSelf: "stretch",
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
  },

  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  secondaryButtonText: {
    color: "#7B5A43",
    fontSize: 15,
    fontWeight: "900",
  },
});
