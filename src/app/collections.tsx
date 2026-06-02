import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  collectionSummary,
  CollectionSummary,
} from "@/lib/collections";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import {
  nextCollectionPuzzleIndex,
  randomCollectionPuzzleIndex,
} from "@/lib/puzzle-library";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectionsScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const collections = collectionSummary(progress);

  async function continueCollection(collection: CollectionSummary) {
    const index = await nextCollectionPuzzleIndex(collection.id);
    router.push(`/play?mode=random&index=${index}`);
  }

  async function playRandomCollection(collection: CollectionSummary) {
    const index = await randomCollectionPuzzleIndex(collection.id);
    router.push(`/play?mode=random&index=${index}`);
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Collections"
          subtitle="Complete themed packs and claim collection rewards."
        />
        <ResourceSummary progress={progress} compact />

        <View style={styles.list}>
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onOpen={() => {
                router.push(`/collection-play?collection=${collection.id}`);
              }}
              onContinue={() => continueCollection(collection)}
              onRandom={() => playRandomCollection(collection)}
            />
          ))}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

function CollectionCard({
  collection,
  onOpen,
  onContinue,
  onRandom,
}: {
  collection: CollectionSummary;
  onOpen: () => void;
  onContinue: () => void;
  onRandom: () => void;
}) {
  const width = `${Math.min(collection.progress * 100, 100)}%`;
  const percent = Math.round(collection.progress * 100);
  const isComplete = collection.remaining === 0 && collection.total > 0;

  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen}>
        <View style={styles.cardHeader}>
          <Text style={styles.emoji}>{collection.emoji}</Text>

          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{collection.label}</Text>
            <Text style={styles.cardMeta}>
              {collection.completed}/{collection.total} solved · {percent}%
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width }]} />
        </View>

        <Text style={styles.remainingText}>
          {isComplete
            ? "Complete!"
            : `${collection.remaining} puzzle${collection.remaining === 1 ? "" : "s"} left`}
        </Text>
      </Pressable>

      <View style={styles.cardFooter}>
        <Pressable style={styles.primarySmallButton} onPress={onContinue}>
          <Text style={styles.primarySmallButtonText}>
            {isComplete ? "Replay" : "Continue"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondarySmallButton} onPress={onOpen}>
          <Text style={styles.secondarySmallButtonText}>Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7EAD8",
  },

  content: {
    padding: 20,
    paddingBottom: 36,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backText: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.88)",
  },

  list: {
    gap: 14,
  },

  card: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.75)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  emoji: {
    fontSize: 34,
  },

  cardTitleWrap: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "800",
    color: "#8A654C",
  },

  progressTrack: {
    height: 11,
    marginTop: 15,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.16)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  remainingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "900",
    color: "#7B5A43",
  },

  cardFooter: {
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
  },

  primarySmallButton: {
    flex: 1,
    backgroundColor: "#FF5C8A",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },

  primarySmallButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },

  secondarySmallButton: {
    flex: 1,
    backgroundColor: "#F6E1D0",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },

  secondarySmallButtonText: {
    color: "#6A3F2B",
    fontSize: 13,
    fontWeight: "900",
  },
});
