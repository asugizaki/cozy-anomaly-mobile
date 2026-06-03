import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
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

export default function BonusTanukiScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgressWithEnergy().then(setProgress);
    }, [])
  );

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Find the Tanuki"
          subtitle="Bonus mode foundation."
        />

        <ResourceSummary progress={progress} compact />

        <View style={styles.card}>
          <Text style={styles.tanuki}>🦝</Text>
          <Text style={styles.title}>Hehe... catch me if you can!</Text>
          <Text style={styles.text}>
            Tanuki bonus rounds unlock after restoration milestones. Soon this will launch special hidden-object puzzles with boosted rewards.
          </Text>

          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back to Chapter</Text>
          </Pressable>
        </View>
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
    padding: 22,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
  },

  tanuki: {
    fontSize: 72,
  },

  title: {
    marginTop: 12,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  text: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#7B5A43",
    textAlign: "center",
  },

  button: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
});
