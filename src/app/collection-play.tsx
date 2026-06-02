import { AppBackground } from "@/components/AppBackground";
import {
  collectionEmoji,
  collectionLabel,
  completedPuzzlesForCollection,
  puzzlesForCollection,
  unsolvedPuzzlesForCollection,
} from "@/lib/collections";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import {
  nextCollectionPuzzleIndex,
  randomCollectionPuzzleIndex,
  unsolvedCollectionPuzzleIndex,
} from "@/lib/puzzle-library";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectionPlayScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();
  const collectionId = collection || "general";

  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const total = puzzlesForCollection(collectionId).length;
  const completed = completedPuzzlesForCollection(collectionId, progress).length;
  const unsolved = unsolvedPuzzlesForCollection(collectionId, progress).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && unsolved === 0;

  async function continueCollection() {
    const index = await nextCollectionPuzzleIndex(collectionId);
    router.push(`/play?mode=random&index=${index}`);
  }

  async function playUnsolved() {
    const index = await unsolvedCollectionPuzzleIndex(collectionId);
    router.push(`/play?mode=random&index=${index}`);
  }

  async function playRandom() {
    const index = await randomCollectionPuzzleIndex(collectionId);
    router.push(`/play?mode=random&index=${index}`);
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.emoji}>{collectionEmoji(collectionId)}</Text>

          <Text style={styles.title}>{collectionLabel(collectionId)}</Text>

          <Text style={styles.subtitle}>
            {isComplete
              ? "Collection complete. Replay your favorites or random puzzles."
              : `${unsolved} puzzle${unsolved === 1 ? "" : "s"} left to complete this collection.`}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {completed}/{total} solved · {percent}%
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={continueCollection}>
            <Text style={styles.primaryButtonText}>
              {isComplete ? "Replay Collection" : "▶ Continue Collection"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, isComplete && styles.disabledButton]}
            onPress={playUnsolved}
            disabled={isComplete}
          >
            <Text style={styles.secondaryButtonText}>
              🎯 Play Unsolved Puzzle
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={playRandom}>
            <Text style={styles.secondaryButtonText}>
              🎲 Random From Collection
            </Text>
          </Pressable>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completed}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{unsolved}</Text>
            <Text style={styles.statLabel}>Left</Text>
          </View>
        </View>
      </ScrollView>
    </AppBackground>
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

  hero: {
    alignItems: "center",
    padding: 24,
    borderRadius: 32,
    backgroundColor: "white",
  },

  emoji: {
    fontSize: 56,
  },

  title: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#7B5A43",
    textAlign: "center",
  },

  progressTrack: {
    width: "100%",
    height: 14,
    marginTop: 22,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.14)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  progressText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "900",
    color: "#7B5A43",
  },

  buttonGroup: {
    marginTop: 20,
    gap: 12,
  },

  primaryButton: {
    backgroundColor: "#FF5C8A",
    paddingVertical: 17,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.45,
  },

  statGrid: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "900",
    color: "#7B5A43",
    textTransform: "uppercase",
  },
});
