import { ResourceSummary } from "@/components/ResourceSummary";
import { restorationBundleByChapterId } from "@/data/generatedRestorations";
import { loadGameAudio, playSfx } from "@/lib/audio";
import {
  chapterById,
  chapterSummary,
  currentChapter
} from "@/lib/chapters";
import { loadProgressWithEnergy } from "@/lib/energy";
import { grantRewardMultiplier } from "@/lib/reward-multiplier";
import { tanukiImageForMood } from "@/lib/tanuki-character";
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
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function splitDialogue(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function tanukiMoodForImage(mood?: string) {
  if (mood === "thinking" || mood === "hint") return "thinking";
  if (mood === "happy" || mood === "excited" || mood === "celebration") return "happy";
  return "guide";
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
  const [claimedReward, setClaimedReward] = useState<any>(null);
  const [sparklesVisible, setSparklesVisible] = useState(false);
  const [fade] = useState(new Animated.Value(0));
  const [dialoguePage, setDialoguePage] = useState(0);
  const [claimingMultiplier, setClaimingMultiplier] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

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
  const afterCompleted = repair?.completedAt || 0;

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
  const coveredHeight = Math.max(screenHeight, screenWidth / aspectRatio);
  const coveredWidth = coveredHeight * aspectRatio;
  const coveredLeft = (screenWidth - coveredWidth) / 2;
  const coveredTop = (screenHeight - coveredHeight) / 2;

  useEffect(() => {
    setDialoguePage(0);
    fade.setValue(0);

    Animated.timing(fade, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [restored, fade]);

  useEffect(() => {
    if (!restored) {
      setSparklesVisible(false);
      return;
    }

    setSparklesVisible(true);
    const timeout = setTimeout(() => setSparklesVisible(false), 950);

    return () => clearTimeout(timeout);
  }, [restored]);

  async function handleRestore() {
    if (!repair || claiming) return;

    setClaiming(true);

    const result = await claimChapterRepairReward(chapter.id, repair.id);

    setClaiming(false);
    setProgress(result.progress);

    if (result.reward) {
      setClaimedReward(result.reward);
    }

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

  const introPages = splitDialogue(
    "You reached a restoration milestone. I can fix this part of the room now."
  );
  const restoredPages = splitDialogue(
    [state.tanukiText, state.nextText].filter(Boolean).join(" ")
  );
  const dialoguePages = restored ? restoredPages : introPages;
  const currentDialogue = dialoguePages[Math.min(dialoguePage, dialoguePages.length - 1)] || "Ready!";
  const isLastDialoguePage = dialoguePage >= dialoguePages.length - 1;
  const canShowMultiplier = restored && claimedReward && Object.values(claimedReward).some((value: any) => Number(value || 0) > 0);
  const tanukiImage = tanukiImageForMood(tanukiMoodForImage(state.tanukiMood));

  const overlaysById = new Map(
    state.unlockedOverlays.map((overlay) => [overlay.id, overlay])
  );

  if (restored) {
    const milestone = bundle.manifest.milestones.find(
      (item) => item.id === repair.id || item.unlock_at === repair.completedAt
    );
    const explicitIds = [
      milestone?.overlay_id,
      ...(milestone?.overlay_ids || []),
      repair.id,
    ].filter(Boolean) as string[];

    for (const overlay of bundle.manifest.overlays || []) {
      const overlayFileId =
        overlay.image?.split("/").pop()?.replace(/\.[^.]+$/, "") || "";

      if (
        explicitIds.includes(overlay.id) ||
        explicitIds.includes(overlayFileId) ||
        overlay.unlock_at === repair.completedAt
      ) {
        overlaysById.set(overlay.id, overlay);
      }
    }
  }

  const visibleOverlays = Array.from(overlaysById.values()).sort(
    (a, b) => (a.z || 0) - (b.z || 0)
  );

  function goNextDialogue() {
    if (!isLastDialoguePage) {
      setDialoguePage((page) => page + 1);
    }
  }

  async function claimDoubleReward() {
    if (!claimedReward || claimingMultiplier) return;

    setClaimingMultiplier(true);

    const result = await grantRewardMultiplier({
      source: "restoration",
      reward: claimedReward,
      metadata: {
        chapterId: chapter.id,
        repairId: repair.id,
        completedAt: repair.completedAt,
      },
    });

    setClaimingMultiplier(false);

    if (result.success) {
      setProgress(result.progress);
      Alert.alert("Bonus Claimed!", "Your extra reward was added.");
    } else if (result.message) {
      Alert.alert("2x Reward", result.message);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundWrap}>
        <Image
          source={background}
          style={[
            styles.coveredBackground,
            {
              width: coveredWidth,
              height: coveredHeight,
              left: coveredLeft,
              top: coveredTop,
            },
          ]}
          resizeMode="cover"
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.coveredSceneLayer,
            {
              opacity: fade,
              width: coveredWidth,
              height: coveredHeight,
              left: coveredLeft,
              top: coveredTop,
            },
          ]}
        >
          {visibleOverlays.map((overlay) => {
            const source = overlayImageSource(bundle, overlay);

            if (!source) return null;

            const sourceRatio =
              (overlay.source_height || 1) / (overlay.source_width || 1);
            const overlayWidth = coveredWidth * overlay.width;
            const overlayHeight = overlayWidth * sourceRatio;
            let overlayLeft = coveredWidth * overlay.x - overlayWidth / 2;
            let overlayTop = coveredHeight * overlay.y - overlayHeight / 2;

            if (overlay.anchor === "bottom_center") {
              overlayTop = coveredHeight * overlay.y - overlayHeight;
            } else if (overlay.anchor === "top_center") {
              overlayTop = coveredHeight * overlay.y;
            }

            return (
              <Image
                key={overlay.id}
                source={source}
                style={[
                  styles.overlayImage,
                  {
                    left: overlayLeft,
                    top: overlayTop,
                    width: overlayWidth,
                    height: overlayHeight,
                    zIndex: 10 + (overlay.z || 0),
                    elevation: 10 + (overlay.z || 0),
                  },
                ]}
                resizeMode="contain"
              />
            );
          })}

          {sparklesVisible && (
            <View style={styles.sparkleLayer} pointerEvents="none">
              <Text style={[styles.sparkle, styles.sparkleOne]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleTwo]}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkleThree]}>✧</Text>
              <Text style={[styles.sparkle, styles.sparkleFour]}>✨</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <SafeAreaView pointerEvents="box-none" style={styles.safeOverlay}>
        <View style={styles.topHud}>
          <ResourceSummary progress={progress} compact />
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomDialogueArea}>
          <Image source={tanukiImage} style={styles.ponImage} resizeMode="contain" />

          <View style={styles.speechBubble}>
            <View style={styles.nameTag}>
              <Text style={styles.nameTagText}>Pon 🐾</Text>
            </View>

            <Text style={styles.kicker}>
              {restored ? "Restored!" : "Restoration Ready"}
            </Text>

            <Text style={styles.title}>{repair.title}</Text>

            <Text style={styles.dialogueText}>{currentDialogue}</Text>

            <View style={styles.dialogueActions}>
              {!isLastDialoguePage ? (
                <Pressable style={styles.nextButton} onPress={goNextDialogue}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </Pressable>
              ) : restored ? (
                <>
                  <View style={styles.equalButtonSlot}>
                    <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={continuePlaying}>
                      <Text style={styles.primaryButtonText} numberOfLines={1}>Continue</Text>
                    </Pressable>
                  </View>

                  {canShowMultiplier && (
                    <View style={styles.equalButtonSlot}>
                      <Pressable
                        style={[styles.actionButton, styles.secondaryButton, claimingMultiplier && styles.buttonDisabled]}
                        disabled={claimingMultiplier}
                        onPress={claimDoubleReward}
                      >
                        <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit>
                          {claimingMultiplier ? "Loading..." : "🎬 2x Reward"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              ) : (
                <Pressable
                  style={[styles.actionButton, styles.primaryButton, styles.restoreButton, claiming && styles.buttonDisabled]}
                  disabled={claiming}
                  onPress={handleRestore}
                >
                  <Text style={styles.primaryButtonText}>
                    {claiming ? "Restoring..." : "Restore"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  backgroundWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  coveredBackground: {
    position: "absolute",
  },

  coveredSceneLayer: {
    position: "absolute",
  },

  overlayImage: {
    position: "absolute",
  },

  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  sparkle: {
    position: "absolute",
    color: "#FFF7B2",
    fontWeight: "900",
    textShadowColor: "rgba(255, 151, 64, 0.75)",
    textShadowRadius: 8,
  },

  sparkleOne: {
    left: "38%",
    top: "38%",
    fontSize: 42,
  },

  sparkleTwo: {
    left: "58%",
    top: "44%",
    fontSize: 34,
  },

  sparkleThree: {
    left: "48%",
    top: "58%",
    fontSize: 38,
  },

  sparkleFour: {
    left: "66%",
    top: "55%",
    fontSize: 30,
  },

  safeOverlay: {
    flex: 1,
    paddingHorizontal: 14,
  },

  topHud: {
    paddingTop: 6,
  },

  spacer: {
    flex: 1,
  },

  bottomDialogueArea: {
    marginBottom: 10,
    paddingTop: 172,
  },

  ponImage: {
    position: "absolute",
    right: -92,
    top: -28,
    width: 334,
    height: 360,
    zIndex: 2,
  },

  speechBubble: {
    width: "100%",
    minHeight: 176,
    paddingHorizontal: 22,
    paddingTop: 31,
    paddingBottom: 18,
    borderRadius: 28,
    backgroundColor: "rgba(255,247,236,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },

  nameTag: {
    position: "absolute",
    left: 24,
    top: -18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FF5C8A",
    transform: [{ rotate: "2deg" }],
  },

  nameTagText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  kicker: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  title: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  dialogueText: {
    marginTop: 9,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "800",
    color: "#7C2D12",
  },

  dialogueActions: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  equalButtonSlot: {
    flex: 1,
    minWidth: 0,
  },

  actionButton: {
    width: "100%",
    minHeight: 58,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  restoreButton: {
    flex: 1,
  },

  primaryButton: {
    backgroundColor: "#22C55E",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "#F59E0B",
  },

  secondaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  nextButton: {
    marginLeft: "auto",
    minWidth: 130,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  buttonDisabled: {
    opacity: 0.65,
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
