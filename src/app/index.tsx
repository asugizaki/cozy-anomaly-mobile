import { PUZZLES } from "@/data/puzzles";
import { avatarById } from "@/lib/avatars";
import {
  closestIncompleteCollection,
  collectionSummary,
} from "@/lib/collections";
import { getDailyPuzzleIndex } from "@/lib/daily-puzzle";
import { loadProgress } from "@/lib/player-progress";
import { xpProgress } from "@/lib/progression";
import {
  nextCollectionPuzzleIndex,
  smartRandomPuzzleIndex,
} from "@/lib/puzzle-library";
import { titleById } from "@/lib/titles";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
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
  const [completedCount, setCompletedCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [randomIndex, setRandomIndex] = useState(0);
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [lootBoxes, setLootBoxes] = useState(0);
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
      loadProgress().then((progress) => {
        setCompletedCount(progress.completedPuzzleIds.length);
        setCurrentStreak(progress.currentStreak || 0);
        setFavoriteCount((progress.favoritePuzzleIds || []).length);
        setRecentCount((progress.recentPlayedPuzzleIds || []).length);
        setCoins(progress.coins || 0);
        setLootBoxes(progress.lootBoxes || 0);
        setSkillPoints(progress.skillPoints || 0);
        setCurrentAvatarId(progress.currentAvatarId || "tanuki");
        setEquippedTitleId(progress.equippedTitleId || "rookie_observer");

        const xp = xpProgress(progress.xp || 0);
        setLevel(xp.level);
        setXpPercent(xp.progress);

        const closest =
          closestIncompleteCollection(progress) ||
          collectionSummary(progress)[0];

        setFeaturedCollection(closest || null);
      });

      smartRandomPuzzleIndex().then(setRandomIndex);

      Promise.all([
        smartRandomPuzzleIndex({ difficulty: "easy" }),
        smartRandomPuzzleIndex({ difficulty: "medium" }),
        smartRandomPuzzleIndex({ difficulty: "hard" }),
      ]).then(([easy, medium, hard]) => {
        setDifficultyIndexes({
          easy,
          medium,
          hard,
        });
      });
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

          <Link href="/stats" asChild>
            <Pressable style={styles.iconButton}>
              <Text style={styles.iconText}>📊</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.content}>
          <Text style={styles.logo}>Cozy Anomaly</Text>

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

          <View style={styles.statCardRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{PUZZLES.length}</Text>
              <Text style={styles.statLabel}>Puzzles</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{favoriteCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
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
            <Link href={`/play?mode=random&index=${randomIndex}`} asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>🎲 Play Random</Text>
              </Pressable>
            </Link>

            <View style={styles.difficultyRow}>
              <Link
                href={`/play?mode=random&index=${difficultyIndexes.easy}`}
                asChild
              >
                <Pressable style={[styles.difficultyButton, styles.easyButton]}>
                  <Text style={styles.difficultyButtonText}>🟢 Easy</Text>
                </Pressable>
              </Link>

              <Link
                href={`/play?mode=random&index=${difficultyIndexes.medium}`}
                asChild
              >
                <Pressable
                  style={[styles.difficultyButton, styles.mediumButton]}
                >
                  <Text style={styles.difficultyButtonText}>🟡 Medium</Text>
                </Pressable>
              </Link>

              <Link
                href={`/play?mode=random&index=${difficultyIndexes.hard}`}
                asChild
              >
                <Pressable style={[styles.difficultyButton, styles.hardButton]}>
                  <Text style={styles.difficultyButtonText}>🔴 Hard</Text>
                </Pressable>
              </Link>
            </View>

            <Link
              href={`/play?mode=daily&index=${dailyPuzzleIndex}`}
              asChild
            >
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  ☀ Daily Challenge
                </Text>
              </Pressable>
            </Link>

            <View style={styles.navGrid}>
              <Link href="/collections" asChild>
                <Pressable style={styles.navCard}>
                  <Text style={styles.navCardText}>📚 Collections</Text>
                </Pressable>
              </Link>

              <Link href="/lootboxes" asChild>
                <Pressable style={styles.navCard}>
                  <Text style={styles.navCardText}>🎁 Loot Boxes</Text>
                </Pressable>
              </Link>

              <Link href="/skill-tree" asChild>
                <Pressable style={styles.navCard}>
                  <Text style={styles.navCardText}>🌳 Skill Tree</Text>
                </Pressable>
              </Link>

              <Link href="/favorites" asChild>
                <Pressable style={styles.navCard}>
                  <Text style={styles.navCardText}>
                    ⭐ Favorites {favoriteCount ? `(${favoriteCount})` : ""}
                  </Text>
                </Pressable>
              </Link>

              <Link href="/recent" asChild>
                <Pressable style={styles.navCard}>
                  <Text style={styles.navCardText}>
                    🕘 Recent {recentCount ? `(${recentCount})` : ""}
                  </Text>
                </Pressable>
              </Link>

              <Link href="/stats" asChild>
                <Pressable style={styles.navCard}>
                  <Text style={styles.navCardText}>🏆 Stats</Text>
                </Pressable>
              </Link>
            </View>
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

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
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
