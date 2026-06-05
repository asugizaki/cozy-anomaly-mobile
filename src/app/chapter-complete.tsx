import { FullRestorationBackdrop } from "@/components/FullRestorationBackdrop";
import { ResourceSummary } from "@/components/ResourceSummary";
import {
  chapterById,
  chapterSummary,
  currentChapter,
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

export default function ChapterCompleteScreen() {
  const params = useLocalSearchParams<{ chapter?: string }>();
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    loadGameAudio();
    playSfx("levelup");
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

  function continueToNextChapter() {
    const nextChapter = currentChapter(progress);
    const nextIndex = nextChapterPuzzleIndex(nextChapter, progress);

    if (nextChapter.id !== chapter.id && nextChapter.completed === 0) {
      router.replace(`/chapter-intro?chapter=${nextChapter.id}`);
      return;
    }

    if (nextIndex < 0) {
      Alert.alert(
        "More puzzles needed",
        "You have played all available puzzles. Import the next chapter pack to continue.",
        [{ text: "Home", onPress: () => router.replace("/") }]
      );
      return;
    }

    router.replace(
      `/play?mode=chapter&chapter=${nextChapter.id}&index=${nextIndex}`
    );
  }

  return (
    <View style={styles.screen}>
      <FullRestorationBackdrop
        chapter={chapter}
        progress={progress}
        completedOverride={chapter.targetPuzzleCount}
        forceClean
      >
        <SafeAreaView style={styles.overlay}>
          <ResourceSummary progress={progress} compact />

          <View style={styles.spacer} />

          <View style={styles.panel}>
            <Text style={styles.kicker}>Chapter Complete</Text>
            <Text style={styles.title}>
              {chapter.emoji} {chapter.title}
            </Text>
            <Text style={styles.subtitle}>{chapter.completionText}</Text>

            <View style={styles.rewardCard}>
              <Text style={styles.chest}>🎁</Text>
              <View style={styles.rewardTextWrap}>
                <Text style={styles.rewardTitle}>Restoration Chest Earned</Text>
                <Text style={styles.rewardText}>
                  You finished this chapter. The next chapter is ready when the
                  next pack is available.
                </Text>
              </View>
            </View>

            <View style={styles.dialogueCard}>
              <Text style={styles.tanuki}>🦝🎉</Text>
              <Text style={styles.dialogueText}>
                Amazing work! This place is glowing again. Let's see where our
                next hidden room takes us.
              </Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={continueToNextChapter}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.replace("/chapter-map")}
            >
              <Text style={styles.secondaryButtonText}>View Chapter Map</Text>
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

  rewardCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
  },

  chest: {
    fontSize: 40,
  },

  rewardTextWrap: {
    flex: 1,
  },

  rewardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400E",
  },

  rewardText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#7C2D12",
  },

  dialogueCard: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    padding: 13,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
  },

  tanuki: {
    fontSize: 34,
  },

  dialogueText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    color: "#7C2D12",
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
