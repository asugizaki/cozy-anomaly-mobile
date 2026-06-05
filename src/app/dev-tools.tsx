import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { AppBackground } from "@/components/AppBackground";
import { CHAPTERS, chapterSummary } from "@/lib/chapters";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  saveProgress,
} from "@/lib/player-progress";
import { repairRewardId } from "@/lib/restoration";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DB_NAME = "cozy-anomaly.db";

export default function DevToolsScreen() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const chapter = CHAPTERS[0];

  useEffect(() => {
    loadProgress().then((progress) => {
      const summary = chapterSummary(chapter, progress, true);
      setCompletedCount(summary.completed);
    });
  }, [chapter.id, refreshKey]);

  const repairs = useMemo(() => chapter.repairs || [], [chapter.id]);

  async function clearAllLocalData() {
    try {
      await AsyncStorage.clear();

      try {
        await SQLite.deleteDatabaseAsync(DB_NAME);
      } catch {
        // Expo Go may keep the db handle alive until reload. AsyncStorage reset
        // is enough for gameplay progress; db will reseed on next clean launch.
      }

      await saveProgress({
        ...DEFAULT_PROGRESS,
        lastEnergyAt: Date.now(),
      });

      setRefreshKey((value) => value + 1);

      Alert.alert(
        "Cleared",
        "Local save data was reset. Restart Expo with cache cleared for the cleanest test."
      );
    } catch (error) {
      Alert.alert(
        "Clear failed",
        error instanceof Error ? error.message : "Could not clear local data."
      );
    }
  }

  async function prepareRestoration(repairId: string, completedAt: number) {
    const progress = await loadProgress();
    const summary = chapterSummary(chapter, progress, true);

    const idsToMarkComplete = summary.puzzleIds.slice(0, completedAt);
    const repairIdsToUnclaim = summary.repairs
      .filter((repair) => repair.completedAt >= completedAt)
      .map((repair) => repairRewardId(summary.id, repair.id));

    const updated = {
      ...progress,
      completedPuzzleIds: Array.from(
        new Set([
          ...progress.completedPuzzleIds,
          ...idsToMarkComplete,
        ])
      ),
      totalSolved: Math.max(progress.totalSolved || 0, completedAt),
      claimedChapterRepairRewardIds: (
        progress.claimedChapterRepairRewardIds || []
      ).filter((id) => !repairIdsToUnclaim.includes(id)),
      energy: Math.max(progress.energy || 0, 50),
      maxEnergy: progress.maxEnergy || 20,
    };

    await saveProgress(updated);

    router.push(
      `/restore?chapter=${summary.id}&repair=${repairId}&devSequence=1`
    );
  }

  async function prepareFullSequence() {
    const firstRepair = repairs[0];

    if (!firstRepair) {
      Alert.alert("No repairs", "This chapter has no restoration milestones.");
      return;
    }

    await prepareRestoration(firstRepair.id, firstRepair.completedAt);
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Developer Tools</Text>
        <Text style={styles.subtitle}>
          Temporary tools for testing restoration and bonus flow.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Test Chapter</Text>
          <Text style={styles.cardText}>
            {chapter.emoji} {chapter.title}
          </Text>
          <Text style={styles.cardText}>Completed: {completedCount}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clear Data</Text>
          <Text style={styles.cardText}>
            Resets local progress, rewards, energy, and attempts to delete the
            local SQLite puzzle DB.
          </Text>

          <Pressable style={styles.dangerButton} onPress={clearAllLocalData}>
            <Text style={styles.dangerButtonText}>Clear Local Test Data</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Restoration Test Sequence</Text>
          <Text style={styles.cardText}>
            Starts from the first restoration. After you restore one milestone,
            Continue will automatically open the next restoration until all
            milestones are tested.
          </Text>

          <Pressable style={styles.primaryButton} onPress={prepareFullSequence}>
            <Text style={styles.primaryButtonText}>Start Full Restoration Test</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Jump to Specific Restoration</Text>

          {repairs.map((repair) => (
            <Pressable
              key={repair.id}
              style={styles.secondaryButton}
              onPress={() => prepareRestoration(repair.id, repair.completedAt)}
            >
              <Text style={styles.secondaryButtonText}>
                Test {repair.completedAt}: {repair.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.backButton} onPress={() => router.replace("/")}>
          <Text style={styles.backButtonText}>Back Home</Text>
        </Pressable>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#4B2E20",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7B5A43",
  },

  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.93)",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#7B5A43",
  },

  primaryButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },

  secondaryButton: {
    marginTop: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 14,
    fontWeight: "900",
  },

  dangerButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },

  dangerButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },

  backButton: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
  },

  backButtonText: {
    color: "#4B2E20",
    fontSize: 15,
    fontWeight: "900",
  },
});
