import { FullRestorationBackdrop } from "@/components/FullRestorationBackdrop";
import { ResourceSummary } from "@/components/ResourceSummary";
import {
  chapterById,
  chapterSummary,
  nextChapterPuzzleIndex,
} from "@/lib/chapters";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChapterIntroScreen() {
  const params = useLocalSearchParams<{ chapter?: string }>();
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    loadGameAudio();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressWithEnergy().then(setProgress);
    }, [])
  );

  const chapterDef = chapterById(String(params.chapter || "matcha_cafe"));
  const chapter = useMemo(
    () => chapterSummary(chapterDef, progress, true),
    [chapterDef.id, progress]
  );

  function startChapter() {
    const nextIndex = nextChapterPuzzleIndex(chapter, progress);

    if (nextIndex < 0) {
      Alert.alert(
        "No puzzles available",
        "Import more puzzles for this chapter pack before starting."
      );
      return;
    }

    playSfx("tap");
    router.replace(
      `/play?mode=chapter&chapter=${chapter.id}&index=${nextIndex}`
    );
  }

  return (
    <View style={styles.screen}>
      <FullRestorationBackdrop
        chapter={chapter}
        progress={progress}
        completedOverride={0}
      >
        <SafeAreaView style={styles.overlay}>
          <ResourceSummary progress={progress} compact />

          <View style={styles.spacer} />

          <View style={styles.panel}>
            <Text style={styles.kicker}>New Chapter</Text>
            <Text style={styles.title}>
              {chapter.emoji} {chapter.title}
            </Text>
            <Text style={styles.subtitle}>{chapter.subtitle}</Text>

            <View style={styles.dialogueCard}>
              <Text style={styles.tanuki}>🦝</Text>
              <View style={styles.dialogueTextWrap}>
                <Text style={styles.tanukiName}>Pon</Text>
                <Text style={styles.dialogueText}>{chapter.intro}</Text>
                <Text style={styles.goalText}>
                  Complete puzzles to restore this place step by step.
                </Text>
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={startChapter}>
              <Text style={styles.primaryButtonText}>Start Chapter</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.replace("/chapter-map")}
            >
              <Text style={styles.secondaryButtonText}>Back to Map</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </FullRestorationBackdrop>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 16,
  },

  spacer: {
    flex: 1,
  },

  panel: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,247,236,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  kicker: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FF5C8A",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  title: {
    marginTop: 3,
    fontSize: 27,
    fontWeight: "900",
    color: "#4B2E20",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7B5A43",
  },

  dialogueCard: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
    padding: 13,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.70)",
  },

  tanuki: {
    fontSize: 36,
  },

  dialogueTextWrap: {
    flex: 1,
  },

  tanukiName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#92400E",
  },

  dialogueText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#7C2D12",
  },

  goalText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#A16207",
  },

  primaryButton: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
  },

  secondaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
    fontWeight: "900",
  },
});
