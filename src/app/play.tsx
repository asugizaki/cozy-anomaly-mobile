import { PUZZLES } from "@/data/puzzles";
import { getPuzzleEngine } from "@/game-engines";
import { loadGameAudio, playSfx, startMusic, updateMusic } from "@/lib/audio";
import { loadSettings } from "@/lib/game-settings";
import {
  loadProgress,
  PlayerProgress,
  saveProgress,
} from "@/lib/player-progress";
import { safePuzzleIndex, smartRandomPuzzleIndex } from "@/lib/puzzle-library";
import { ComposablePuzzle, PuzzleSlot } from "@/types/puzzle";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_ATTEMPTS = 3;
const MAX_HINT_LEVEL = 3;
const RECENT_HISTORY_LIMIT = 15;

function imageDimensions(source: ImageSourcePropType) {
  const resolved = Image.resolveAssetSource(source);
  return {
    width: resolved?.width || 1080,
    height: resolved?.height || 2400,
  };
}

function itemStyleForSlot(
  slot: PuzzleSlot,
  puzzle: ComposablePuzzle,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  const itemWidth = puzzle.rendering.item_width;
  const itemHeight = puzzle.rendering.item_height;
  const footOverlap = puzzle.rendering.foot_overlap;

  return {
    left: offsetX + (slot.x - itemWidth / 2) * scale,
    top: offsetY + (slot.surface_y - itemHeight + footOverlap) * scale,
    width: itemWidth * scale,
    height: itemHeight * scale,
  };
}

function boxStyle(
  box: { x1: number; y1: number; x2: number; y2: number },
  scale: number,
  offsetX: number,
  offsetY: number,
  padding: number
) {
  return {
    left: offsetX + (box.x1 - padding) * scale,
    top: offsetY + (box.y1 - padding) * scale,
    width: (box.x2 - box.x1 + padding * 2) * scale,
    height: (box.y2 - box.y1 + padding * 2) * scale,
  };
}

export default function PlayScreen() {
  const params = useLocalSearchParams<{ mode?: string; index?: string }>();

  const initialPuzzleIndex = safePuzzleIndex(Number(params.index || 0));

  const [puzzleIndex, setPuzzleIndex] = useState(
    Number.isFinite(initialPuzzleIndex) ? initialPuzzleIndex : 0
  );

  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const puzzle = PUZZLES[puzzleIndex];
  const engine = useMemo(() => getPuzzleEngine(puzzle), [puzzle]);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    async function init() {
      const loadedSettings = await loadSettings();
      const loadedProgress = await loadProgress();

      setSettings(loadedSettings);
      setProgress(loadedProgress);

      await loadGameAudio();
      await startMusic(loadedSettings);
    }

    init();
  }, []);

  useEffect(() => {
    if (!settings) return;
    updateMusic(settings);
  }, [settings]);

  useEffect(() => {
    setReady(false);
    fadeAnim.setValue(0);

    const timer = setTimeout(() => {
      setReady(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 350);

    return () => clearTimeout(timer);
  }, [puzzleIndex, fadeAnim]);

  const backgroundSize = useMemo(() => {
    if (!puzzle) return { width: 1080, height: 2400 };
    return imageDimensions(puzzle.backgroundSource);
  }, [puzzle]);

  const layout = useMemo(() => {
    const scale = Math.max(
      screenWidth / backgroundSize.width,
      screenHeight / backgroundSize.height
    );

    const renderWidth = backgroundSize.width * scale;
    const renderHeight = backgroundSize.height * scale;

    return {
      scale,
      renderWidth,
      renderHeight,
      offsetX: (screenWidth - renderWidth) / 2,
      offsetY: (screenHeight - renderHeight) / 2,
    };
  }, [screenWidth, screenHeight, backgroundSize]);

  if (!puzzle) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.title}>No puzzles imported yet</Text>
        <Text style={styles.subtitle}>
          Run npm run import:puzzles then restart Expo.
        </Text>
      </SafeAreaView>
    );
  }

  const hasNextPuzzle = puzzleIndex < PUZZLES.length - 1;
  const answerVisualBox = puzzle.answer_visual_box ?? puzzle.answer_box;
  const isDailyMode = params.mode === "daily";
  const showHintCircle = hintLevel >= MAX_HINT_LEVEL;

  async function saveProgressPatch(patch: Partial<PlayerProgress>) {
    if (!progress) return;

    const updated: PlayerProgress = {
      ...progress,
      ...patch,
    };

    setProgress(updated);
    await saveProgress(updated);
  }

  async function markSolved(wasFailed: boolean) {
    if (!progress) return;

    const alreadyCompleted = progress.completedPuzzleIds.includes(puzzle.id);

    const recentPuzzleIndexes = [
      ...(progress.recentPuzzleIndexes || []),
      puzzleIndex,
    ].slice(-RECENT_HISTORY_LIMIT);

    await saveProgressPatch({
      completedPuzzleIds: alreadyCompleted
        ? progress.completedPuzzleIds
        : [...progress.completedPuzzleIds, puzzle.id],

      totalSolved: alreadyCompleted
        ? progress.totalSolved
        : progress.totalSolved + 1,

      currentStreak: wasFailed
        ? progress.currentStreak
        : progress.currentStreak + 1,

      lastPuzzleIndex: puzzleIndex,
      recentPuzzleIndexes,
    });
  }

  async function incrementHintUsage() {
    if (!progress) return;

    await saveProgressPatch({
      hintsUsed: progress.hintsUsed + 1,
    });
  }

  function hapticSelection() {
    if (settings?.hapticsEnabled) Haptics.selectionAsync();
  }

  function hapticImpact() {
    if (settings?.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function hapticSuccess() {
    if (settings?.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function hapticError() {
    if (settings?.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function resetCurrentPuzzle() {
    hapticSelection();
    playSfx("tap", settings);

    setSolved(false);
    setFailed(false);
    setAttemptsLeft(MAX_ATTEMPTS);
    setHintLevel(0);
  }

  async function goToNextPuzzle() {
    hapticSelection();
    playSfx("tap", settings);

    if (isDailyMode) {
      router.back();
      return;
    }

    if (params.mode !== "random" && !hasNextPuzzle) {
      Alert.alert("Finished", "You completed all puzzles.");
      return;
    }

    const nextIndex =
      params.mode === "random"
        ? await smartRandomPuzzleIndex()
        : puzzleIndex + 1;

        if (progress) {
          const recentPuzzleIndexes = [
            ...(progress.recentPuzzleIndexes || []),
            puzzleIndex,
          ].slice(-RECENT_HISTORY_LIMIT);

          await saveProgressPatch({
            lastPuzzleIndex: nextIndex,
            recentPuzzleIndexes,
          });
        }

    setPuzzleIndex(nextIndex);
    setSolved(false);
    setFailed(false);
    setAttemptsLeft(MAX_ATTEMPTS);
    setHintLevel(0);
  }

  function requestHint() {
    if (hintLevel >= MAX_HINT_LEVEL || solved) return;

    Alert.alert(
      "Watch Ad for Hint",
      "Rewarded ad placeholder.\n\nIn production, this will show a rewarded video ad before unlocking the next hint.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "🎬 Watch Ad",
          onPress: async () => {
            hapticImpact();
            playSfx("hint", settings);
            await incrementHintUsage();

            setHintLevel((current) =>
              Math.min(current + 1, MAX_HINT_LEVEL)
            );
          },
        },
      ]
    );
  }

  function handlePress(event: any) {
    if (!ready || solved) return;

    const tapX = event.nativeEvent.pageX;
    const tapY = event.nativeEvent.pageY;

    const originalX = (tapX - layout.offsetX) / layout.scale;
    const originalY = (tapY - layout.offsetY) / layout.scale;

    if (engine.checkTap({ x: originalX, y: originalY }, puzzle)) {
      hapticSuccess();
      playSfx("correct", settings);

      setSolved(true);
      setFailed(false);
      markSolved(false);
      return;
    }

    const nextAttempts = attemptsLeft - 1;
    setAttemptsLeft(nextAttempts);

    if (nextAttempts <= 0) {
      hapticError();
      playSfx("reveal", settings);

      setSolved(true);
      setFailed(true);
      markSolved(true);
      return;
    }

    hapticImpact();
    playSfx("wrong", settings);
  }

  return (
    <View style={styles.screen}>
      <Pressable style={styles.gameLayer} onPress={handlePress}>
        <Animated.View style={[styles.renderLayer, { opacity: fadeAnim }]}>
          <Image
            source={puzzle.backgroundSource}
            resizeMode="stretch"
            style={[
              styles.background,
              {
                width: layout.renderWidth,
                height: layout.renderHeight,
                left: layout.offsetX,
                top: layout.offsetY,
              },
            ]}
          />

          {engine.kind === "find_anomaly" &&
            puzzle.slots.map((slot, index) => {
              const isTarget = index === puzzle.target_slot_index;

              return (
                <Image
                  key={`${puzzle.id}-${index}`}
                  source={
                    isTarget
                      ? puzzle.anomalyItemSource
                      : puzzle.normalItemSource
                  }
                  resizeMode="stretch"
                  style={[
                    styles.item,
                    itemStyleForSlot(
                      slot,
                      puzzle,
                      layout.scale,
                      layout.offsetX,
                      layout.offsetY
                    ),
                  ]}
                />
              );
            })}

          {(solved || showHintCircle) && (
            <View
              pointerEvents="none"
              style={[
                solved ? styles.answerCircle : styles.hintPulse,
                boxStyle(
                  answerVisualBox,
                  layout.scale,
                  layout.offsetX,
                  layout.offsetY,
                  solved ? 22 : 90
                ),
              ]}
            />
          )}
        </Animated.View>

        {!ready && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
      </Pressable>

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>

          <View style={styles.titlePill}>
            <Text style={styles.levelText}>
              {isDailyMode
                ? "Daily Puzzle"
                : `Puzzle ${puzzleIndex + 1}/${PUZZLES.length}`}
            </Text>

            <Text style={styles.subText}>{engine.subtitle}</Text>
          </View>

          <View style={styles.triesPill}>
            <Text style={styles.triesText}>Tries: {attemptsLeft}</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={[styles.bottomPanel, failed && styles.failedPanel]}>
          {solved ? (
            <>
              <View
                style={
                  failed
                    ? styles.answerBadgeFailed
                    : styles.answerBadgeSuccess
                }
              >
                <Text style={styles.answerBadgeText}>
                  {failed ? "Answer Revealed" : "Found It!"}
                </Text>
              </View>

              <Text style={styles.panelAnswer}>{puzzle.answer}</Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={resetCurrentPuzzle}
                >
                  <Text style={styles.secondaryButtonText}>Replay</Text>
                </Pressable>

                <Pressable
                  style={styles.primaryButton}
                  onPress={goToNextPuzzle}
                >
                  <Text style={styles.primaryButtonText}>
                    {isDailyMode
                      ? "Back Home"
                      : hasNextPuzzle
                        ? "Next Puzzle"
                        : "Done"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.panelTitle}>{engine.title}</Text>
              <Text style={styles.panelText}>{engine.subtitle}</Text>

              {hintLevel > 0 && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintLabel}>
                    Hint {hintLevel}/{MAX_HINT_LEVEL}
                  </Text>

                  <Text style={styles.hintText}>
                    {hintLevel === 1 && engine.genericHint(puzzle)}
                    {hintLevel >= 2 && engine.preciseHint(puzzle)}
                  </Text>
                </View>
              )}

              <Pressable
                disabled={hintLevel >= MAX_HINT_LEVEL}
                style={[
                  styles.hintButton,
                  hintLevel >= MAX_HINT_LEVEL && styles.disabledButton,
                ]}
                onPress={requestHint}
              >
                <Text style={styles.secondaryButtonText}>
                  {hintLevel >= MAX_HINT_LEVEL
                    ? "Max Hints Used"
                    : "🎬 Watch Ad for Hint"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#120B07" },
  gameLayer: { ...StyleSheet.absoluteFillObject },
  renderLayer: { ...StyleSheet.absoluteFillObject },
  background: { position: "absolute" },
  item: { position: "absolute" },
  overlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 14 },

  topBar: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 40,
    color: "#4B2E20",
    marginTop: -5,
  },

  titlePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
  },

  levelText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  subText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#9B745A",
    textAlign: "center",
  },

  triesPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.90)",
  },

  triesText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4B2E20",
  },

  spacer: { flex: 1 },

  bottomPanel: {
    marginBottom: 10,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(255,247,236,0.92)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },

  failedPanel: {
    borderWidth: 4,
    borderColor: "#FF4F6D",
    backgroundColor: "rgba(255,245,244,0.96)",
  },

  panelTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 4,
  },

  panelText: {
    fontSize: 15,
    color: "#7B5A43",
    marginBottom: 14,
  },

  panelAnswer: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 16,
  },

  hintBox: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },

  hintLabel: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  hintText: {
    color: "white",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  answerBadgeSuccess: {
    alignSelf: "flex-start",
    backgroundColor: "#2FBF71",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 10,
  },

  answerBadgeFailed: {
    alignSelf: "flex-start",
    backgroundColor: "#FF4F6D",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 10,
  },

  answerBadgeText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  hintButton: {
    backgroundColor: "#F4D7C4",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },

  disabledButton: { opacity: 0.45 },
  buttonRow: { flexDirection: "row", gap: 12 },

  primaryButton: {
    flex: 1,
    backgroundColor: "#FF5C8A",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: "#F4D7C4",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
    fontWeight: "900",
  },

  answerCircle: {
    position: "absolute",
    borderWidth: 4,
    borderColor: "#FF4F8A",
    backgroundColor: "rgba(255,79,138,0.08)",
    borderRadius: 999,
  },

  hintPulse: {
    position: "absolute",
    borderWidth: 5,
    borderColor: "#FFD166",
    backgroundColor: "rgba(255,209,102,0.16)",
    borderRadius: 999,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#120B07",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7EAD8",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4B2E20",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#7B5A43",
  },
});