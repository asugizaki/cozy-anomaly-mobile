import { AppBackground } from "@/components/AppBackground";
import { PUZZLES } from "@/data/puzzles";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { puzzleIndexById, smartRandomPuzzleIndex } from "@/lib/puzzle-library";
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

export default function FavoritesScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const favoriteIds = progress.favoritePuzzleIds || [];
  const favoritePuzzles = favoriteIds
    .map((id) => PUZZLES.find((puzzle) => puzzle.id === id))
    .filter(Boolean);

  async function playRandomFavorite() {
    const index = await smartRandomPuzzleIndex({
      favoritesOnly: true,
    });

    router.push(`/play?mode=random&index=${index}`);
  }

  function playPuzzle(puzzleId: string) {
    const index = puzzleIndexById(puzzleId);
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

        <Text style={styles.title}>Favorites</Text>

        <Text style={styles.subtitle}>
          Save puzzles you want to replay later.
        </Text>

        {favoritePuzzles.length > 0 ? (
          <>
            <Pressable style={styles.primaryButton} onPress={playRandomFavorite}>
              <Text style={styles.primaryButtonText}>♥ Play Random Favorite</Text>
            </Pressable>

            <View style={styles.list}>
              {favoritePuzzles.map((puzzle) => {
                if (!puzzle) return null;

                return (
                  <Pressable
                    key={puzzle.id}
                    style={styles.card}
                    onPress={() => playPuzzle(puzzle.id)}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{puzzle.asset}</Text>
                      <Text style={styles.difficulty}>{puzzle.difficulty}</Text>
                    </View>

                    <Text style={styles.answer}>{puzzle.answer}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart on a puzzle to save it here.
            </Text>
          </View>
        )}
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
    color: "#7B5A43",
  },

  primaryButton: {
    marginBottom: 16,
    backgroundColor: "#FF5C8A",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
  },

  list: {
    gap: 12,
  },

  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: "white",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
    textTransform: "capitalize",
  },

  difficulty: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
  },

  answer: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#7B5A43",
    lineHeight: 20,
  },

  emptyCard: {
    padding: 24,
    borderRadius: 26,
    backgroundColor: "white",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#7B5A43",
    textAlign: "center",
    lineHeight: 22,
  },
});
