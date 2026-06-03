import { AnimatedWrongMarker } from "@/components/AnimatedWrongMarker";
import { ZoomablePuzzle, ZoomTransform } from "@/components/ZoomablePuzzle";
import { PUZZLES } from "@/data/puzzles";
import { getPuzzleEngine } from "@/game-engines";
import { loadGameAudio, playSfx, startMusic, updateMusic } from "@/lib/audio";
import { puzzleCollectionId, puzzlesForCollection } from "@/lib/collections";
import { spendEnergy } from "@/lib/energy";
import { loadSettings } from "@/lib/game-settings";
import {
  loadProgress,
  PlayerProgress,
  saveProgress,
} from "@/lib/player-progress";
import { safePuzzleIndex, smartRandomPuzzleIndex } from "@/lib/puzzle-library";
import { calculatePuzzleReward, PuzzleReward } from "@/lib/progression";
import { completePuzzleServerReward } from "@/lib/server-economy";
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

function itemRenderSize(puzzle: ComposablePuzzle) {
  const resolved = Image.resolveAssetSource(puzzle.normalItemSource);
  const assetWidth = resolved?.width || puzzle.rendering.source_width || puzzle.rendering.item_width;
  const assetHeight = resolved?.height || puzzle.rendering.source_height || puzzle.rendering.item_height;

  // In the generator, object_size is the rendered item WIDTH.
  // Some older exports accidentally treated object_size as height, which made
  // wide assets huge on mobile. This normalizes the runtime to the actual PNG.
  const targetWidth =
    puzzle.object_size ||
    puzzle.item_size ||
    puzzle.rendering.source_width ||
    puzzle.rendering.item_width ||
    assetWidth ||
    1;

  const aspect = assetWidth > 0 ? assetHeight / assetWidth : 1;

  return {
    width: targetWidth,
    height: Math.round(targetWidth * aspect),
  };
}

function itemStyleForSlot(
  slot: PuzzleSlot,
  puzzle: ComposablePuzzle,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  const { width: itemWidth, height: itemHeight } = itemRenderSize(puzzle);
  const footOverlap = puzzle.rendering.foot_overlap || 0;

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
  const [assetsReady, setAssetsReady] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintExpanded, setHintExpanded] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [wrongMarkers, setWrongMarkers] = useState<WrongMarker[]>([]);
  const [wrongTapCountInPuzzle, setWrongTapCountInPuzzle] = useState(0);
  const [lastReward, setLastReward] = useState<PuzzleReward | null>(null);
  const [dailyAlreadyCompleted, setDailyAlreadyCompleted] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const consumedEnergyKeyRef = useRef<string | null>(null);

  const puzzle = PUZZLES[puzzleIndex];
  const engine = useMemo(() => getPuzzleEngine(puzzle), [puzzle]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    async function init() {
      const loadedSettings = await loadSettings();
      const loadedProgress = await loadProgress();

      setSettings(loadedSettings);
      setProgress(loadedProgress);
      setDailyAlreadyCompleted(
        params.mode === "daily" &&
          (loadedProgress.completedDailyKeys || []).includes(dailyKey())
      );

      await loadGameAudio();
      await startMusic(loadedSettings);
    }

    init();
  }, []);

  useEffect(() => {
    if (!puzzle) return;

    async function consumeEnergyForPuzzle() {
      if (
        params.mode === "daily" &&
        (progress?.completedDailyKeys || []).includes(dailyKey())
      ) {
        setDailyAlreadyCompleted(true);
        return;
      }

      const key = `${puzzle.id}:${puzzleIndex}`;

      if (consumedEnergyKeyRef.current === key) {
        return;
      }

      consumedEnergyKeyRef.current = key;

      const result = await spendEnergy();

      setProgress(result.progress);

      if (!result.success) {
        Alert.alert(
          "Out of Energy",
          "You need energy to start a puzzle. Watch an ad refill, buy an energy pack with coins, or wait for recharge.",
          [
            {
              text: "Energy Shop",
              onPress: () => router.replace("/energy-shop"),
            },
            {
              text: "Back Home",
              style: "cancel",
              onPress: () => router.replace("/"),
            },
          ]
        );
      }
    }

    consumeEnergyForPuzzle();
  }, [puzzle, puzzleIndex]);

  useEffect(() => {
    if (!settings) return;
    updateMusic(settings);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    async function preparePuzzleAssets() {
      setReady(false);
      setAssetsReady(false);
      fadeAnim.setValue(0);
      setWrongMarkers([]);
      setWrongTapCountInPuzzle(0);
      setLastReward(null);

      const sources = Array.from(
        new Set(
          [
            puzzle.backgroundSource,
            puzzle.normalItemSource,
            puzzle.anomalyItemSource,
          ]
            .map((source) => Image.resolveAssetSource(source)?.uri)
            .filter(Boolean) as string[]
        )
      );

      await Promise.all(
        sources.map((uri) =>
          Image.prefetch(uri).catch(() => {
            return false;
          })
        )
      );

      if (cancelled) return;

      setAssetsReady(true);
      setReady(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }

    preparePuzzleAssets();

    return () => {
      cancelled = true;
    };
  }, [puzzle, puzzleIndex, fadeAnim]);

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

  if (dailyAlreadyCompleted && isDailyMode) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.title}>Daily Complete</Text>
        <Text style={styles.subtitle}>
          Come back tomorrow for a new daily challenge.
        </Text>

        <Pressable
          style={[styles.primaryButton, styles.emptyStateButton]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.primaryButtonText}>Back Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }


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
    const completedPuzzleIds = alreadyCompleted
      ? progress.completedPuzzleIds
      : [...progress.completedPuzzleIds, puzzle.id];

    const collectionId = puzzleCollectionId(puzzle);
    const collectionPuzzleIds = puzzlesForCollection(collectionId).map(
      (item) => item.id
    );

    const wasCollectionComplete =
      collectionPuzzleIds.length > 0 &&
      collectionPuzzleIds.every((id) =>
        progress.completedPuzzleIds.includes(id)
      );

    const isCollectionCompleteNow =
      collectionPuzzleIds.length > 0 &&
      collectionPuzzleIds.every((id) => completedPuzzleIds.includes(id));

    const collectionRewardId = `collection:${collectionId}`;
    const shouldGrantCollectionReward =
      !wasFailed &&
      !wasCollectionComplete &&
      isCollectionCompleteNow &&
      !(progress.claimedCollectionRewardIds || []).includes(collectionRewardId);

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

    if (!wasFailed) {
      try {
        const serverResult = await completePuzzleServerReward({
          progress,
          puzzle: {
            id: puzzle.id,
            difficulty: puzzle.difficulty,
            collection: collectionId,
          },
          puzzleIndex,
          wasFailed,
          alreadyCompleted,
          isPerfect,
          usedNoHints: hintLevel === 0,
          isDailyMode,
          completedCollection: shouldGrantCollectionReward,
          collectionRewardId,
          dailyKey: todayKey,
        });

        if (serverResult) {
          setLastReward(serverResult.reward);
          setProgress(serverResult.progress);

          if (serverResult.reward.leveledUp) {
            playSfx("levelup", settings);
          } else if (serverResult.reward.coins > 0) {
            playSfx("coin", settings);
          } else if (serverResult.reward.xp > 0) {
            playSfx("reward", settings);
          }

          return;
        }
      } catch (error) {
        Alert.alert(
          "Reward claim failed",
          error instanceof Error
            ? error.message
            : "Could not claim puzzle reward from server."
        );
        return;
      }
    }

    const recentPuzzleIndexes = [
      ...(progress.recentPuzzleIndexes || []),
      puzzleIndex,
    ].slice(-RECENT_HISTORY_LIMIT);

    const recentPlayedPuzzleIds = [
      puzzle.id,
      ...(progress.recentPlayedPuzzleIds || []).filter((id) => id !== puzzle.id),
    ].slice(0, RECENT_HISTORY_LIMIT);

    const willCompletePuzzle = !alreadyCompleted && !wasFailed;
    const reward = calculatePuzzleReward({
      puzzle,
      progress,
      wasFailed,
      alreadyCompleted,
      isPerfect,
      usedNoHints: hintLevel === 0,
      isDailyMode,
      completedCollection: shouldGrantCollectionReward,
    });

    setLastReward(reward);

    if (!wasFailed && reward.leveledUp) {
      playSfx("levelup", settings);
    } else if (!wasFailed && reward.coins > 0) {
      playSfx("coin", settings);
    } else if (!wasFailed && reward.xp > 0) {
      playSfx("reward", settings);
    }

    await saveProgressPatch({
      completedPuzzleIds,

      totalSolved: alreadyCompleted
        ? progress.totalSolved
        : progress.totalSolved + 1,

      currentStreak: nextStreak,

      bestStreak: Math.max(progress.bestStreak || 0, nextStreak),

      perfectGames:
        isPerfect && willCompletePuzzle
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
      recentPlayedPuzzleIds,

      xp: (progress.xp || 0) + reward.xp,
      level: reward.levelAfter,
      coins: (progress.coins || 0) + reward.coins,
      lifetimeCoins: (progress.lifetimeCoins || 0) + reward.coins,

      skillPoints: (progress.skillPoints || 0) + reward.skillPoints,
      lootBoxes: (progress.lootBoxes || 0) + reward.lootBoxes,
      claimedCollectionRewardIds: shouldGrantCollectionReward
        ? [...(progress.claimedCollectionRewardIds || []), collectionRewardId]
        : progress.claimedCollectionRewardIds || [],
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
    setLastReward(null);
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
    setLastReward(null);
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
      <ZoomablePuzzle disabled={!assetsReady || !ready || solved} onTap={handlePuzzleTap}>
        <Animated.View style={[styles.renderLayer, { opacity: assetsReady ? fadeAnim : 0 }]}>
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

        {(!assetsReady || !ready) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Preparing scene...</Text>
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

            <View style={styles.titleActions}>
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
          </View>

          <View style={styles.statusStack}>
            <View style={styles.resourcePill}>
              <Text style={styles.resourceText}>⚡ {progress?.energy ?? 0}</Text>
            </View>

            <View style={styles.resourcePill}>
              <Image
                source={require("../../assets/ui/coin.png")}
                style={styles.resourceCoin}
                resizeMode="contain"
              />
              <Text style={styles.resourceText}>{progress?.coins ?? 0}</Text>
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

            {lastReward && !failed && (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardTitle}>
                  {lastReward.leveledUp
                    ? `🎉 Level ${lastReward.levelAfter}!`
                    : "Rewards Earned"}
                </Text>

                <View style={styles.rewardRow}>
                  <Text style={styles.rewardPill}>+{lastReward.xp} XP</Text>
                  <Text style={styles.rewardPill}>+{lastReward.coins} Coins</Text>
                  {lastReward.skillPoints > 0 && (
                    <Text style={styles.rewardPill}>+{lastReward.skillPoints} SP</Text>
                  )}
                  {lastReward.lootBoxes > 0 && (
                    <Text style={styles.rewardPill}>+{lastReward.lootBoxes} Crate</Text>
                  )}
                </View>

                <Text style={styles.rewardReason}>
                  {lastReward.reasons.join(" · ")}
                </Text>
              </View>
            )}

            <Text style={styles.panelAnswer}>{puzzle.answer}</Text>

            <View style={styles.buttonRow}>
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
                    {hintExpanded ? "Hide" : `💡 ${hintLevel}/${MAX_HINT_LEVEL}`}
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
                  Hint {hintLevel}/{MAX_HINT_LEVEL} · tap to collapse
                </Text>

                <Text
                  style={styles.hintText}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {hintText()}
                </Text>
              </Pressable>
            )}

            {hintLevel >= MAX_HINT_LEVEL && !hintExpanded && (
              <Pressable
                style={styles.finalHintCollapsed}
                onPress={() => setHintExpanded(true)}
              >
                <Text style={styles.finalHintText}>
                  🎯 Final hint active
                </Text>
              </Pressable>
            )}

            <Pressable
              disabled={hintLevel >= MAX_HINT_LEVEL}
              style={[
                styles.compactHintButton,
                hintLevel >= MAX_HINT_LEVEL && styles.disabledButton,
              ]}
              onPress={requestHint}
            >
              <Text style={styles.compactHintButtonText}>
                {hintLevel >= MAX_HINT_LEVEL
                  ? "Max Hints"
                  : "🎬 Hint"}
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

  titleActions: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  difficultyBadge: {
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

  resourcePill: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.90)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  resourceText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#4B2E20",
  },

  resourceCoin: {
    width: 16,
    height: 16,
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
    marginBottom: 6,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,247,236,0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.50)",
  },

  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  compactTitleWrap: {
    flex: 1,
  },

  compactTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4B2E20",
  },

  compactSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: "#7B5A43",
    fontWeight: "800",
  },

  hintTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0f172a",
  },

  hintToggleText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
  },

  collapsibleHintBox: {
    marginTop: 7,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },

  hintLabel: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 2,
    textTransform: "uppercase",
  },

  hintText: {
    color: "white",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  finalHintCollapsed: {
    marginTop: 6,
    marginBottom: 6,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,209,102,0.35)",
  },

  finalHintText: {
    color: "#6A3F2B",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  compactHintButton: {
    marginTop: 6,
    backgroundColor: "#F4D7C4",
    paddingVertical: 8,
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

  rewardBox: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
  },

  rewardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 8,
  },

  rewardRow: {
    flexDirection: "row",
    gap: 8,
  },

  rewardPill: {
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },

  rewardReason: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#7B5A43",
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

  compactHintButtonText: {
    color: "#6A3F2B",
    fontSize: 12,
    fontWeight: "900",
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

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7EAD8",
    padding: 24,
  },

  emptyStateButton: {
    marginTop: 22,
    width: "100%",
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
