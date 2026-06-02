import { AppBackground } from "@/components/AppBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { puzzleCountFromDb, seedPuzzleDbIfNeeded } from "@/lib/puzzle-db";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DbStatusScreen() {
  const [count, setCount] = useState(0);
  const [lastSeeded, setLastSeeded] = useState<string>("Not checked");

  async function refresh() {
    const result = await seedPuzzleDbIfNeeded();
    const dbCount = await puzzleCountFromDb();

    setCount(dbCount);
    setLastSeeded(result.seeded ? "Seeded now" : "Already current");
  }

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Local DB"
          subtitle="SQLite puzzle index status."
        />

        <View style={styles.card}>
          <Text style={styles.label}>Puzzle rows</Text>
          <Text style={styles.value}>{count}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Seed status</Text>
          <Text style={styles.value}>{lastSeeded}</Text>
        </View>

        <Pressable style={styles.button} onPress={refresh}>
          <Text style={styles.buttonText}>Refresh</Text>
        </Pressable>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
  },

  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.94)",
    marginBottom: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7B5A43",
    textTransform: "uppercase",
  },

  value: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "900",
    color: "#4B2E20",
  },

  button: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
});
