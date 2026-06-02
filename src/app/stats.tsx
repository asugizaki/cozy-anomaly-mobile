import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AchievementCard } from "@/components/AchievementCard";
import { avatarById } from "@/lib/avatars";
import {
  achievementsForProgress,
  unlockedAchievementCount,
} from "@/lib/achievements";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { xpProgress } from "@/lib/levels";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
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
  const xp = xpProgress(progress.xp || 0);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Stats"
          subtitle="Your progress, achievements, and rewards."
        />
        <ResourceSummary progress={progress} compact />

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Image
              source={avatarById(progress.currentAvatarId).image}
              style={styles.heroAvatar}
              resizeMode="contain"
            />

            <View style={styles.heroTextWrap}>
              <Text style={styles.heroNumber}>Level {xp.level}</Text>
              <Text style={styles.heroLabel}>
                {progress.coins || 0} Coins
              </Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                {
                  width: `${Math.round(xp.progress * 100)}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.heroSubLabel}>
            {xp.xpIntoLevel}/{xp.xpNeeded} XP to Level {xp.level + 1}
          </Text>
        </View>

        <View style={styles.grid}>
          <Stat label="Solved" value={progress.totalSolved} />
          <Stat label="Streak" value={progress.currentStreak} />
          <Stat label="Unique" value={progress.completedPuzzleIds.length} />
          <Stat label="Perfect" value={progress.perfectGames} />
          <Stat label="Daily" value={progress.dailyChallengesCompleted} />
          <Stat label="Hints" value={progress.hintsUsed} />
          <Stat label="Wrong Taps" value={progress.totalWrongTaps} />
          <Stat label="Lifetime Coins" value={progress.lifetimeCoins || 0} />
          <Stat label="Avatars" value={(progress.unlockedAvatarIds || []).length} />
          <Stat label="Loot Boxes" value={progress.lootBoxes || 0} />
          <Stat label="Skill Points" value={progress.skillPoints || 0} />
          <Stat label="Titles" value={(progress.unlockedTitleIds || []).length} />
          <Stat label="Favorites" value={progress.favoritePuzzleIds?.length || 0} />
          <Stat label="Energy" value={progress.energy || 0} />
          <Stat label="Energy Spent" value={progress.totalEnergySpent || 0} />
          <Stat label="Ad Refills" value={progress.totalEnergyFromAds || 0} />
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
    </AppBackground>
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
    color: "white",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },

  heroCard: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: "#FF5C8A",
    marginBottom: 18,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  heroAvatar: {
    width: 76,
    height: 76,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroNumber: {
    fontSize: 36,
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

  xpTrack: {
    height: 12,
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },

  xpFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
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
