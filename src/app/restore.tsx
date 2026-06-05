import { ResourceSummary } from "@/components/ResourceSummary";
import { restorationBundleByChapterId } from "@/data/generatedRestorations";
import { loadGameAudio, playSfx } from "@/lib/audio";
import {
  chapterById,
  chapterSummary,
  currentChapter
} from "@/lib/chapters";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
  loadProgress,
  saveProgress,
} from "@/lib/player-progress";
import {
  claimChapterRepairReward,
  repairRewardForMilestone,
  repairRewardId,
} from "@/lib/restoration";
import {
  overlayImageSource,
  restorationBackgroundSource,
  unlockedRestorationState,
} from "@/lib/restoration-runtime";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function rewardText(completedAt: number) {
  const reward = repairRewardForMilestone(completedAt);
  const parts = [`+${reward.xp} XP`, `+${reward.coins} coins`];

  if (reward.lootBoxes) parts.push(`+${reward.lootBoxes} crate`);

  return parts.join(" · ");
}

function tanukiMoodEmoji(mood?: string) {
  if (mood === "excited") return "🤩";
  if (mood === "thinking") return "🤔";
  if (mood === "celebration") return "🎉";
  if (mood === "hint") return "💡";
  return "😊";
}

export default function RestoreScreen() {
  const params = useLocalSearchParams<{
    chapter?: string;
    repair?: string;
    nextIndex?: string;
    devSequence?: string;
  }>();

  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [restored, setRestored] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [fade] = useState(new Animated.Value(0));

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

  const repair =
    chapter.repairs.find((item) => item.id === params.repair) ||
    chapter.repairs.find((item) => chapter.completed >= item.completedAt) ||
    chapter.repairs[0];

  const bundle = restorationBundleByChapterId(chapter.id);
  const beforeCompleted = Math.max(0, (repair?.completedAt || 1) - 1);
  const afterCompleted = Math.max(chapter.completed, repair?.completedAt || 0);

  const renderChapter = {
    ...chapter,
    completed: restored ? afterCompleted : beforeCompleted,
  };

  const state = bundle
    ? unlockedRestorationState(bundle, renderChapter, progress)
    : undefined;

  const background = bundle && state
    ? restorationBackgroundSource(bundle, state)
    : undefined;

  const canvas = bundle?.manifest.mobile_canvas || {
    width: 900,
    height: 1600,
  };
  const aspectRatio = canvas.width / canvas.height;

  useEffect(() => {
    fade.setValue(0);

    Animated.timing(fade, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [restored, fade]);

  async function handleRestore() {
    if (!repair || claiming) return;

    setClaiming(true);

    const result = await claimChapterRepairReward(chapter.id, repair.id);

    setClaiming(false);
    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Restore", result.message);
      return;
    }

    setRestored(true);
    playSfx("reward");
  }

  async function seedNextDevRestoration(nextRepairId: string, completedAt: number) {
    const latest = await loadProgress();
    const idsToAdd = chapter.puzzleIds.slice(0, completedAt);
    const nextRewardId = repairRewardId(chapter.id, nextRepairId);

    await saveProgress({
      ...latest,
      completedPuzzleIds: Array.from(
        new Set([
          ...latest.completedPuzzleIds,
          ...idsToAdd,
        ])
      ),
      totalSolved: Math.max(latest.totalSolved || 0, completedAt),
      claimedChapterRepairRewardIds: (
        latest.claimedChapterRepairRewardIds || []
      ).filter((id) => id !== nextRewardId),
      energy: Math.max(latest.energy || 0, 50),
    });
  }

  async function continuePlaying() {
    const repairedCount = repair?.completedAt || 0;
    const finalRepairAt = Math.max(
      ...chapter.repairs.map((item) => item.completedAt),
      chapter.targetPuzzleCount
    );

    if (params.devSequence === "1") {
      const nextRepair = chapter.repairs.find(
        (item) => item.completedAt > repairedCount
      );

      if (nextRepair) {
        await seedNextDevRestoration(nextRepair.id, nextRepair.completedAt);
        router.replace(
          `/restore?chapter=${chapter.id}&repair=${nextRepair.id}&devSequence=1`
        );
        return;
      }

      Alert.alert("Restoration test complete", "All restoration milestones were tested.", [
        {
          text: "Back to Dev Tools",
          onPress: () => router.replace("/dev-tools"),
        },
      ]);
      return;
    }

    const next =
      restored && repairedCount >= finalRepairAt
        ? "chapter-complete"
        : "play";

    router.replace(
      `/bonus-tanuki?chapter=${chapter.id}&next=${next}`
    );
  }

  if (!bundle || !repair || !background || !state) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyTitle}>Restoration data missing</Text>
        <Text style={styles.emptyText}>
          Import the chapter restoration bundle, then restart Expo with cache
          cleared.
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => router.replace("/")}>
          <Text style={styles.primaryButtonText}>Back Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={background}
        style={styles.background}
        resizeMode="cover"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fullSceneLayer,
            {
              opacity: fade,
              aspectRatio,
            },
          ]}
        >
          {state.unlockedOverlays.map((overlay) => {
            const source = overlayImageSource(bundle, overlay);

            if (!source) return null;

            const sourceRatio =
              (overlay.source_height || 1) / (overlay.source_width || 1);

            const widthPercent = overlay.width * 100;
            const heightPercent = overlay.width * sourceRatio * aspectRatio * 100;

            let leftPercent = overlay.x * 100 - widthPercent / 2;
            let topPercent = overlay.y * 100 - heightPercent / 2;

            if (overlay.anchor === "bottom_center") {
              topPercent = overlay.y * 100 - heightPercent;
            } else if (overlay.anchor === "top_center") {
              topPercent = overlay.y * 100;
            }

            return (
              <View
                key={overlay.id}
                style={[
                  styles.overlayImageWrap,
                  {
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${widthPercent}%`,
                    zIndex: 10 + (overlay.z || 0),
                  },
                ]}
              >
                <Image
                  source={source}
                  style={{ width: "100%", aspectRatio: 1 / sourceRatio }}
                  resizeMode="contain"
                />
              </View>
            );
          })}
        </Animated.View>

        <SafeAreaView style={styles.safeOverlay}>
          <View style={styles.topHud}>
            <ResourceSummary progress={progress} compact />
          </View>

          <View style={styles.spacer} />

          <View style={styles.bottomPanel}>
            <View style={styles.dialogueRow}>
              <Text style={styles.tanukiEmoji}>
                🦝{tanukiMoodEmoji(state.tanukiMood)}
              </Text>

              <View style={styles.dialogueTextWrap}>
                <Text style={styles.kicker}>
                  {restored ? "Restored!" : "Restoration Ready"}
                </Text>

                <Text style={styles.title}>{repair.title}</Text>

                <Text style={styles.dialogueText}>
                  {restored
                    ? state.tanukiText
                    : "You reached a restoration milestone. Tap restore to improve the room."}
                </Text>

                {!!state.nextText && restored && (
                  <Text style={styles.nextText}>{state.nextText}</Text>
                )}
              </View>
            </View>

            <Text style={styles.rewardText}>{rewardText(repair.completedAt)}</Text>

            {restored ? (
              <Pressable style={styles.primaryButton} onPress={continuePlaying}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.primaryButton}
                disabled={claiming}
                onPress={handleRestore}
              >
                <Text style={styles.primaryButtonText}>
                  {claiming ? "Restoring..." : "Restore"}
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  background: {
    flex: 1,
  },

  fullSceneLayer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  overlayImageWrap: {
    position: "absolute",
  },

  safeOverlay: {
    flex: 1,
    paddingHorizontal: 16,
  },

  topHud: {
    paddingTop: 6,
  },

  spacer: {
    flex: 1,
  },

  bottomPanel: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 26,
    backgroundColor: "rgba(255,247,236,0.93)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },

  dialogueRow: {
    flexDirection: "row",
    gap: 11,
  },

  tanukiEmoji: {
    fontSize: 36,
    marginTop: 2,
  },

  dialogueTextWrap: {
    flex: 1,
  },

  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  title: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
  },

  dialogueText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#7C2D12",
  },

  nextText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#A16207",
  },

  rewardText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "900",
    color: "#7B5A43",
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 11,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
  },

  empty: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#120B07",
  },

  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 10,
    marginBottom: 20,
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "700",
  },
});
