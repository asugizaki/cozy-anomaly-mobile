import { AnimatedWrongMarker } from "@/components/AnimatedWrongMarker";
import { ZoomablePuzzle, ZoomTransform } from "@/components/ZoomablePuzzle";
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

type WrongMarker = {
  id: string;
  x: number;
  y: number;
};

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
  const sourceWidth = puzzle.rendering.item_width;
  const sourceHeight = puzzle.rendering.item_height;
  const aspect = sourceHeight > 0 ? sourceWidth / sourceHeight : 1;

  const itemHeight = puzzle.item_size || sourceHeight;
  const itemWidth = itemHeight * aspect;
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

function difficultyMeta(difficulty: string) {
  if (difficulty === "easy") {
    return { label: "EASY", emoji: "🟢", color: "#22c55e" };
  }

  if (difficulty === "hard") {
    return { label: "HARD", emoji: "🔴", color: "#ef4444" };
  }

  return { label: "MEDIUM", emoji: "🟡", color: "#f59e0b" };
}

function gameTitle(isDailyMode: boolean, engineTitle: string) {
  return isDailyMode ? "Daily Challenge" : engineTitle;
}

function dailyKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function screenPointToOriginalPoint(
  screenX: number,
  screenY: number,
  transform: ZoomTransform,
  screenWidth: number,
  screenHeight: number,
  layout: {
    scale: number;
    offsetX: number;
    offsetY: number;
  }
) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;

  const unzoomedX =
    (screenX - centerX - transform.translateX) / transform.scale + centerX;

  const unzoomedY =
    (screenY - centerY - transform.translateY) / transform.scale + centerY;

  return {
    x: (unzoomedX - layout.offsetX) / layout.scale,
    y: (unzoomedY - layout.offsetY) / layout.scale,
  };
}

export default function PlayScreen() {
  const params = useLocalSearchParams<{ mode?: string; index?: string }>();
  const initialPuzzleIndex = safePuzzleIndex(Number(params.index || 0));

  const [puzzleIndex, setPuzzleIndex] = useState(initialPuzzleIndex);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintExpanded, setHintExpanded] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [wrongMarkers, setWrongMarkers] = useState<WrongMarker[]>([]);
  const [wrongTapCountInPuzzle, setWrongTapCountInPuzzle] = useState(0);

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
    setWrongMarkers([]);
    setWrongTapCountInPuzzle(0);

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

  const answerVisualBox = puzzle.answer_visual_box ?? puzzle.answer_box;
  const isDailyMode = params.mode === "daily";
  const showHintCircle = hintLevel >= MAX_HINT_LEVEL;
  const difficulty = difficultyMeta(puzzle.difficulty);
  const currentStreak = progress?.currentStreak || 0;

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

    const nextStreak = wasFailed ? 0 : progress.currentStreak + 1;
    const isPerfect =
      !wasFailed &&
      wrongTapCountInPuzzle === 0 &&
      hintLevel === 0 &&
      attemptsLeft === MAX_ATTEMPTS;

    const todayKey = dailyKey();
    const completedDailyKeys = progress.completedDailyKeys || [];
    const hasCompletedDailyToday = completedDailyKeys.includes(todayKey);
    const shouldCountDaily =
      isDailyMode && !wasFailed && !hasCompletedDailyToday;

    await saveProgressPatch({
      completedPuzzleIds: alreadyCompleted
        ? progress.completedPuzzleIds
        : [...progress.completedPuzzleIds, puzzle.id],

      totalSolved: alreadyCompleted
        ? progress.totalSolved
        : progress.totalSolved + 1,

      currentStreak: nextStreak,

      bestStreak: Math.max(progress.bestStreak || 0, nextStreak),

      perfectGames:
        isPerfect && !alreadyCompleted
          ? progress.perfectGames + 1
          : progress.perfectGames,

      dailyChallengesCompleted: shouldCountDaily
        ? progress.dailyChallengesCompleted + 1
        : progress.dailyChallengesCompleted,

      completedDailyKeys: shouldCountDaily
        ? [...completedDailyKeys, todayKey]
        : completedDailyKeys,

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

  async function recordWrongTap() {
    if (!progress) return;

    await saveProgressPatch({
      totalWrongTaps: progress.totalWrongTaps + 1,
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
    setHintExpanded(false);
    setWrongMarkers([]);
    setWrongTapCountInPuzzle(0);
  }

  async function goToNextPuzzle() {
    hapticSelection();
    playSfx("tap", settings);

    if (isDailyMode) {
      router.back();
      return;
    }

    const recentPuzzleIndexes = [
      ...(progress?.recentPuzzleIndexes || []),
      puzzleIndex,
    ].slice(-RECENT_HISTORY_LIMIT);

    const nextIndex = await smartRandomPuzzleIndex({
      excludeIndexes: recentPuzzleIndexes,
    });

    if (progress) {
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
    setHintExpanded(false);
    setWrongMarkers([]);
    setWrongTapCountInPuzzle(0);
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

            const nextLevel = Math.min(hintLevel + 1, MAX_HINT_LEVEL);

            setHintLevel(nextLevel);
            setHintExpanded(nextLevel < MAX_HINT_LEVEL);
          },
        },
      ]
    );
  }

  function showWrongMarker(x: number, y: number) {
    const id = `${Date.now()}-${Math.random()}`;

    setWrongMarkers((current) => [...current, { id, x, y }]);

    setTimeout(() => {
      setWrongMarkers((current) =>
        current.filter((marker) => marker.id !== id)
      );
    }, 700);
  }

  function handlePuzzleTap(
    screenX: number,
    screenY: number,
    transform: ZoomTransform
  ) {
    if (!ready || solved) return;

    const original = screenPointToOriginalPoint(
      screenX,
      screenY,
      transform,
      screenWidth,
      screenHeight,
      layout
    );

    if (engine.checkTap({ x: original.x, y: original.y }, puzzle)) {
      hapticSuccess();
      playSfx("correct", settings);

      setSolved(true);
      setFailed(false);
      markSolved(false);
      return;
    }

    setWrongTapCountInPuzzle((current) => current + 1);
    recordWrongTap();

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
    showWrongMarker(screenX, screenY);
  }

  function hintText() {
    if (hintLevel <= 0) return "";

    if (hintLevel === 1) {
      return engine.genericHint(puzzle);
    }

    return engine.preciseHint(puzzle);
  }

  return (
    <View style={styles.screen}>
      <ZoomablePuzzle disabled={!ready || solved} onTap={handlePuzzleTap}>
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
                    isTarget ? puzzle.anomalyItemSource : puzzle.normalItemSource
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
      </ZoomablePuzzle>

      {wrongMarkers.map((marker) => (
        <AnimatedWrongMarker key={marker.id} x={marker.x} y={marker.y} />
      ))}

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>

          <View style={styles.titlePill}>
            <Text style={styles.levelText}>
              {gameTitle(isDailyMode, engine.title)}
            </Text>

            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: difficulty.color },
              ]}
            >
              <Text style={styles.difficultyText}>
                {difficulty.emoji} {difficulty.label}
              </Text>
            </View>
          </View>

          <View style={styles.statusStack}>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {currentStreak}</Text>
            </View>

            <View style={styles.triesPill}>
              <Text style={styles.triesText}>Tries: {attemptsLeft}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        {solved ? (
          <View style={[styles.bottomPanel, failed && styles.failedPanel]}>
            <View
              style={
                failed ? styles.answerBadgeFailed : styles.answerBadgeSuccess
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

              <Pressable style={styles.primaryButton} onPress={goToNextPuzzle}>
                <Text style={styles.primaryButtonText}>
                  {isDailyMode ? "Back Home" : "Next Random"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.compactHintDock}>
            <View style={styles.compactHeader}>
              <View style={styles.compactTitleWrap}>
                <Text style={styles.compactTitle}>{engine.title}</Text>
                <Text style={styles.compactSubtitle}>{engine.subtitle}</Text>
              </View>

              {hintLevel > 0 && (
                <Pressable
                  style={styles.hintTogglePill}
                  onPress={() => setHintExpanded((current) => !current)}
                >
                  <Text style={styles.hintToggleText}>
                    💡 {hintLevel}/{MAX_HINT_LEVEL}
                  </Text>
                </Pressable>
              )}
            </View>

            {hintLevel > 0 && hintExpanded && (
              <Pressable
                style={styles.collapsibleHintBox}
                onPress={() => setHintExpanded(false)}
              >
                <Text style={styles.hintLabel}>
                  Hint {hintLevel}/{MAX_HINT_LEVEL} · Tap to hide
                </Text>

                <Text style={styles.hintText}>{hintText()}</Text>
              </Pressable>
            )}

            {hintLevel >= MAX_HINT_LEVEL && !hintExpanded && (
              <Text style={styles.finalHintText}>
                Final hint is active. Look for the glowing circle.
              </Text>
            )}

            <Pressable
              disabled={hintLevel >= MAX_HINT_LEVEL}
              style={[
                styles.compactHintButton,
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
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#120B07" },
  renderLayer: { ...StyleSheet.absoluteFillObject },
  background: { position: "absolute" },
  item: { position: "absolute" },
  overlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 14 },

  topBar: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
  },

  levelText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  difficultyBadge: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  difficultyText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
  },

  statusStack: {
    gap: 6,
    alignItems: "flex-end",
  },

  streakPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.90)",
  },

  streakText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#4B2E20",
  },

  triesPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.90)",
  },

  triesText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#4B2E20",
  },

  spacer: { flex: 1 },

  compactHintDock: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,247,236,0.92)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },

  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  compactTitleWrap: {
    flex: 1,
  },

  compactTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  compactSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: "#7B5A43",
    fontWeight: "700",
  },

  hintTogglePill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#0f172a",
  },

  hintToggleText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },

  collapsibleHintBox: {
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
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
    lineHeight: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  finalHintText: {
    marginTop: 8,
    marginBottom: 8,
    color: "#7B5A43",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  compactHintButton: {
    marginTop: 12,
    backgroundColor: "#F4D7C4",
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: "center",
  },

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

  panelAnswer: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 16,
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
