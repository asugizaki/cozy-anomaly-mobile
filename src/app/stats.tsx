import { AchievementCard } from "@/components/AchievementCard";
import {
  achievementsForProgress,
  unlockedAchievementCount,
} from "@/lib/achievements";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StatsScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const achievements = achievementsForProgress(progress);
  const unlockedCount = unlockedAchievementCount(progress);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Your Stats</Text>

        <Text style={styles.subtitle}>
          Track your cozy detective progress.
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroNumber}>🔥 {progress.currentStreak}</Text>
          <Text style={styles.heroLabel}>Current Streak</Text>

          <Text style={styles.heroSubLabel}>
            Best streak: {progress.bestStreak || progress.currentStreak || 0}
          </Text>
        </View>

        <View style={styles.grid}>
          <Stat label="Solved" value={progress.totalSolved} />
          <Stat label="Unique" value={progress.completedPuzzleIds.length} />
          <Stat label="Perfect" value={progress.perfectGames} />
          <Stat label="Daily" value={progress.dailyChallengesCompleted} />
          <Stat label="Hints" value={progress.hintsUsed} />
          <Stat label="Wrong Taps" value={progress.totalWrongTaps} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionMeta}>
            {unlockedCount}/{achievements.length}
          </Text>
        </View>

        <View style={styles.achievementList}>
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7EAD8",
  },

  content: {
    padding: 20,
    paddingBottom: 36,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#4B2E20",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#7B5A43",
  },

  heroCard: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: "#FF5C8A",
    marginBottom: 18,
  },

  heroNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: "white",
  },

  heroLabel: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: "white",
  },

  heroSubLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
  },

  value: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7B5A43",
    marginTop: 5,
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4B2E20",
  },

  sectionMeta: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7B5A43",
  },

  achievementList: {
    gap: 12,
  },
});
