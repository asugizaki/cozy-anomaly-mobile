import { NotificationBell } from "@/components/NotificationBell";
import { PUZZLES } from "@/data/puzzles";
import { avatarById } from "@/lib/avatars";
import {
  closestIncompleteCollection,
  collectionSummary,
} from "@/lib/collections";
import { getDailyPuzzleIndex } from "@/lib/daily-puzzle";
import { loadProgressWithEnergy, secondsUntilNextEnergy } from "@/lib/energy";
import { xpProgress } from "@/lib/levels";
import {
  nextCollectionPuzzleIndex,
  smartRandomPuzzleIndex,
} from "@/lib/puzzle-library";
import { currentChapter, nextChapterPuzzleIndex } from "@/lib/chapters";
import { titleById } from "@/lib/titles";
import { PlayerProgress } from "@/lib/player-progress";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type DifficultyIndexes = {
  easy: number;
  medium: number;
  hard: number;
};


function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatEnergyTimer(seconds: number) {
  if (seconds <= 0) return "Full";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${`${remainingSeconds}`.padStart(2, "0")}`;
}

type FeaturedCollection = {
  id: string;
  emoji: string;
  label: string;
  completed: number;
  total: number;
  remaining: number;
  progress: number;
};

export default function HomeScreen() {
  const [homeProgress, setHomeProgress] = useState<PlayerProgress | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [energy, setEnergy] = useState(20);
  const [maxEnergy, setMaxEnergy] = useState(20);
  const [nextEnergySeconds, setNextEnergySeconds] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [lootBoxes, setLootBoxes] = useState(0);
  const [randomIndex, setRandomIndex] = useState(0);
  const [playChapterId, setPlayChapterId] = useState("matcha_cafe");
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [skillPoints, setSkillPoints] = useState(0);
  const [xpPercent, setXpPercent] = useState(0);
  const [currentAvatarId, setCurrentAvatarId] = useState("tanuki");
  const [equippedTitleId, setEquippedTitleId] = useState("rookie_observer");
  const [featuredCollection, setFeaturedCollection] =
    useState<FeaturedCollection | null>(null);
  const [difficultyIndexes, setDifficultyIndexes] =
    useState<DifficultyIndexes>({
      easy: 0,
      medium: 0,
      hard: 0,
    });

  const insets = useSafeAreaInsets();
  const dailyPuzzleIndex = getDailyPuzzleIndex();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function refreshHomeProgress() {
        const progress = await loadProgressWithEnergy();

        if (!mounted) return;

        setHomeProgress(progress);
        setCompletedCount(progress.completedPuzzleIds.length);
        setCurrentStreak(progress.currentStreak || 0);
        setEnergy(progress.energy || 0);
        setMaxEnergy(progress.maxEnergy || 20);
        setNextEnergySeconds(secondsUntilNextEnergy(progress));
        setDailyCompleted((progress.completedDailyKeys || []).includes(todayKey()));
        setLootBoxes(progress.lootBoxes || 0);
        setCoins(progress.coins || 0);
        setSkillPoints(progress.skillPoints || 0);
        setCurrentAvatarId(progress.currentAvatarId || "tanuki");
        setEquippedTitleId(progress.equippedTitleId || "rookie_observer");

        const xp = xpProgress(progress.xp || 0);
        setLevel(xp.level);
        setXpPercent(xp.progress);

        const activeChapter = currentChapter(progress);
        setPlayChapterId(activeChapter.id);
        setRandomIndex(nextChapterPuzzleIndex(activeChapter, progress));

        setFeaturedCollection(closestIncompleteCollection(progress));
      }

      refreshHomeProgress();
      const timer = setInterval(refreshHomeProgress, 1000);

      return () => {
        mounted = false;
        clearInterval(timer);
      };
    }, [])
  );

  async function continueFeaturedCollection() {
    if (!featuredCollection) return;

    const index = await nextCollectionPuzzleIndex(featuredCollection.id);
    router.push(`/play?mode=random&index=${index}`);
  }

  const currentAvatar = avatarById(currentAvatarId);
  const equippedTitle = titleById(equippedTitleId);

  return (
    <ImageBackground
      source={require("../../assets/home-bg.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.overlay}>
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top + 10, 42),
            },
          ]}
        >
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <Text style={styles.iconText}>⚙</Text>
            </Pressable>
          </Link>

          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {currentStreak}</Text>
          </View>

          <NotificationBell progress={homeProgress} />
        </View>

        <View style={styles.content}>
          <Text style={styles.logo}>Hidden Tanuki</Text>

          <Text style={styles.subtitle}>
            Spot tiny differences in cozy scenes.
          </Text>

          <Link href="/avatar-shop" asChild>
            <Pressable style={styles.profileCard}>
              <Text style={styles.profileAvatar}>{currentAvatar.emoji}</Text>

              <View style={styles.profileContent}>
                <Text style={styles.profileTitle}>Level {level}</Text>
                <Text style={styles.profileSubtitle}>
                  {equippedTitle.name} · 🪙 {coins} · 🎁 {lootBoxes} · 🌟 {skillPoints}
                </Text>

                <View style={styles.xpTrack}>
                  <View
                    style={[
                      styles.xpFill,
                      {
                        width: `${Math.round(xpPercent * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </Pressable>
          </Link>

          <View
            style={[
              styles.energyCard,
              energy <= 0 && styles.energyCardEmpty,
            ]}
          >
            <View style={styles.energyHeader}>
              <Text style={styles.energyBigIcon}>⚡</Text>

              <View style={styles.energyMainText}>
                <Text style={styles.energyTitle}>
                  {energy}/{maxEnergy}
                </Text>
                <Text style={styles.energySubtitle}>
                  {energy <= 0
                    ? "Out of energy. Refill to keep playing."
                    : nextEnergySeconds > 0
                      ? `Next energy in ${formatEnergyTimer(nextEnergySeconds)}`
                      : "Energy is full"}
                </Text>
              </View>
            </View>

            <Link href="/energy-shop" asChild>
              <Pressable
                style={[
                  styles.energyButton,
                  energy <= 0 && styles.energyButtonUrgent,
                ]}
              >
                <Text style={styles.energyButtonText}>
                  {energy <= 0 ? "Refill Now" : "Refill"}
                </Text>
              </Pressable>
            </Link>
          </View>

          

          {featuredCollection && (
            <Pressable
              style={styles.collectionProgressCard}
              onPress={continueFeaturedCollection}
            >
              <View style={styles.collectionProgressHeader}>
                <Text style={styles.collectionEmoji}>
                  {featuredCollection.emoji}
                </Text>

                <View style={styles.collectionTextWrap}>
                  <Text style={styles.collectionTitle}>
                    Continue {featuredCollection.label}
                  </Text>

                  <Text style={styles.collectionSubtitle}>
                    {featuredCollection.remaining === 0
                      ? "Collection complete. Replay it anytime."
                      : `${featuredCollection.remaining} left · ${featuredCollection.completed}/${featuredCollection.total} solved`}
                  </Text>
                </View>
              </View>

              <View style={styles.collectionTrack}>
                <View
                  style={[
                    styles.collectionFill,
                    {
                      width: `${Math.round(
                        featuredCollection.progress * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </Pressable>
          )}

          <View style={styles.buttonGroup}>
            <Link
              href={`/play?mode=chapter&chapter=${playChapterId}&index=${randomIndex}`}
              asChild
            >
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>▶ Play</Text>
              </Pressable>
            </Link>

            {/*
              Daily Challenge is intentionally paused for now.
              The game should have one simple main path before launch.
            */}

            <Link href="/hub" asChild>
              <Pressable style={styles.hubButton}>
                <Text style={styles.hubButtonText}>✨ Progress Hub</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 24,
  },

  streakPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  streakText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4B2E20",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 310,
  },

  profileCard: {
    width: "100%",
    marginTop: 15,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  profileAvatar: {
    fontSize: 38,
  },

  profileContent: {
    flex: 1,
  },

  profileTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#4B2E20",
  },

  profileSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: "#7B5A43",
  },

  xpTrack: {
    height: 8,
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.16)",
    overflow: "hidden",
  },

  xpFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  energyCard: {
    width: "100%",
    marginTop: 14,
    padding: 18,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },

  energyCardEmpty: {
    backgroundColor: "rgba(255,235,238,0.97)",
    borderColor: "#FF6B7A",
  },

  energyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  energyBigIcon: {
    fontSize: 42,
  },

  energyMainText: {
    flex: 1,
  },

  energyTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#4B2E20",
  },

  energySubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: "#7B5A43",
  },

  energyButton: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  energyButtonUrgent: {
    backgroundColor: "#EF4444",
  },

  energyButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },

  statCardRow: {
    width: "100%",
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center",
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A654C",
    textTransform: "uppercase",
  },

  collectionProgressCard: {
    width: "100%",
    marginTop: 12,
    padding: 13,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  collectionProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  collectionEmoji: {
    fontSize: 28,
  },

  collectionTextWrap: {
    flex: 1,
  },

  collectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4B2E20",
  },

  collectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#7B5A43",
  },

  collectionTrack: {
    height: 8,
    marginTop: 9,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.16)",
    overflow: "hidden",
  },

  collectionFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  buttonGroup: {
    width: "100%",
    marginTop: 14,
    gap: 10,
  },

  primaryButton: {
    backgroundColor: "#FF5C8A",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },

  difficultyButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
  },

  easyButton: {
    backgroundColor: "rgba(34,197,94,0.96)",
  },

  mediumButton: {
    backgroundColor: "rgba(245,158,11,0.96)",
  },

  hardButton: {
    backgroundColor: "rgba(239,68,68,0.96)",
  },

  difficultyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "#F6E1D0",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.55,
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
    fontWeight: "900",
  },

  hubButton: {
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  hubButtonText: {
    color: "#4B2E20",
    fontSize: 17,
    fontWeight: "900",
  },

  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  navCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: "center",
  },

  navCardText: {
    color: "#4B2E20",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
});
