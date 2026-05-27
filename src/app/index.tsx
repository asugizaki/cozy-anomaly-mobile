import { PUZZLES } from "@/data/puzzles";
import { getDailyPuzzleIndex } from "@/lib/daily-puzzle";
import { loadProgress } from "@/lib/player-progress";
import { smartRandomPuzzleIndex } from "@/lib/puzzle-library";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HomeScreen() {
  const [completedCount, setCompletedCount] = useState(0);
  const [lastPuzzleIndex, setLastPuzzleIndex] = useState(0);

  const insets = useSafeAreaInsets();
  const [randomIndex, setRandomIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then((progress) => {
        setCompletedCount(progress.completedPuzzleIds.length);

        const safeIndex =
          progress.lastPuzzleIndex >= 0 &&
          progress.lastPuzzleIndex < PUZZLES.length
            ? progress.lastPuzzleIndex
            : 0;

        setLastPuzzleIndex(safeIndex);
      });

      smartRandomPuzzleIndex().then(setRandomIndex);
    }, [])
  );

  const dailyPuzzleIndex = getDailyPuzzleIndex();

  return (
    <ImageBackground
      source={require("../../assets/home-bg.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.overlay}>
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top + 10, 42),
            },
          ]}
        >
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <Text style={styles.iconText}>⚙</Text>
            </Pressable>
          </Link>

          <Link href="/stats" asChild>
            <Pressable style={styles.iconButton}>
              <Text style={styles.iconText}>📊</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.content}>
          <Text style={styles.logo}>Cozy Anomaly</Text>

          <Text style={styles.subtitle}>
            Find the tiny difference in cozy scenes.
          </Text>

          <View style={styles.statsPill}>
            <Text style={styles.statsText}>
              {completedCount} / {PUZZLES.length} solved
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <Link href={`/play?index=${lastPuzzleIndex}`} asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </Link>

            <Link
              href={`/play?mode=daily&index=${dailyPuzzleIndex}`}
              asChild
            >
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Daily Puzzle</Text>
              </Pressable>
            </Link>

            <Link href={`/play?mode=random&index=${randomIndex}`} asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Random Puzzle</Text>
              </Pressable>
            </Link>

            <Link href="/play?index=0" asChild>
              <Pressable style={styles.ghostButton}>
                <Text style={styles.ghostButtonText}>
                  Start From Beginning
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Cozy café vibes ✦ relaxing puzzles ✦ daily challenges
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 24,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 300,
  },

  statsPill: {
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.90)",
  },

  statsText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4B2E20",
  },

  buttonGroup: {
    width: "100%",
    marginTop: 34,
    gap: 14,
  },

  primaryButton: {
    backgroundColor: "#FF5C8A",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "#F6E1D0",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 18,
    fontWeight: "900",
  },

  ghostButton: {
    alignItems: "center",
    paddingVertical: 14,
  },

  ghostButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  footer: {
    paddingBottom: 18,
    alignItems: "center",
  },

  footerText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    textAlign: "center",
  },
});