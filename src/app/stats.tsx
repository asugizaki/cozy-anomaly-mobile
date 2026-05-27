import { loadProgress } from "@/lib/player-progress";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function StatsScreen() {
  const [progress, setProgress] = useState({
    completedPuzzleIds: [],
    currentStreak: 0,
    totalSolved: 0,
    hintsUsed: 0,
  });

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Your Stats</Text>

      <View style={styles.grid}>
        <Stat label="Solved" value={progress.totalSolved} />
        <Stat label="Streak" value={progress.currentStreak} />
        <Stat label="Hints Used" value={progress.hintsUsed} />
        <Stat label="Completed" value={progress.completedPuzzleIds.length} />
      </View>
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
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4B2E20",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  card: {
    width: "47%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 22,
  },
  value: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FF5C8A",
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#7B5A43",
    marginTop: 6,
  },
});