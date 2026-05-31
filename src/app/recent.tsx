import { FavoriteButton } from "@/components/FavoriteButton";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { puzzleIndexById, puzzlesByIds } from "@/lib/puzzle-library";
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

function difficultyEmoji(difficulty: string) {
  if (difficulty === "easy") return "🟢";
  if (difficulty === "hard") return "🔴";
  return "🟡";
}

export default function RecentScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const recentPuzzles = puzzlesByIds(progress.recentPlayedPuzzleIds || []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Recently Played</Text>

        <Text style={styles.subtitle}>
          Jump back into puzzles you recently solved or revealed.
        </Text>

        {!recentPuzzles.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No recent puzzles yet</Text>
            <Text style={styles.emptyText}>
              Play a few puzzles and they’ll show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentPuzzles.map((puzzle) => {
              const index = puzzleIndexById(puzzle.id);

              return (
                <Pressable
                  key={puzzle.id}
                  style={styles.card}
                  onPress={() => {
                    router.push(`/play?mode=random&index=${index}`);
                  }}
                >
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle}>
                      {difficultyEmoji(puzzle.difficulty)}{" "}
                      {puzzle.asset || "Puzzle"}
                    </Text>

                    <Text style={styles.cardMeta}>
                      {puzzle.difficulty.toUpperCase()} ·{" "}
                      {puzzle.collection || puzzle.category || "general"}
                    </Text>

                    <Text numberOfLines={2} style={styles.cardAnswer}>
                      {puzzle.answer}
                    </Text>
                  </View>

                  <FavoriteButton puzzleId={puzzle.id} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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

  emptyCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: "white",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#7B5A43",
  },

  list: {
    gap: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "white",
  },

  cardMain: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  cardAnswer: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#7B5A43",
  },
});
