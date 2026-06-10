import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  chapterSummaries,
  currentChapter,
  nextChapterPuzzleIndex,
} from "@/lib/chapters";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function statusText(chapter: ReturnType<typeof chapterSummaries>[number]) {
  if (chapter.fullyRestored) return "Complete";
  if (!chapter.unlocked) return "Locked";
  if (chapter.contentStatus === "missing") return "Needs content";
  if (chapter.contentStatus === "warning") return "Content low";
  if (chapter.completed === 0) return "New";
  return `${chapter.completed}/${chapter.total}`;
}

function statusEmoji(chapter: ReturnType<typeof chapterSummaries>[number]) {
  if (chapter.fullyRestored) return "✅";
  if (!chapter.unlocked) return "🔒";
  if (chapter.contentStatus === "missing") return "⚠️";
  if (chapter.completed === 0) return "✨";
  return "▶";
}

function starText(stars: number) {
  return stars > 0 ? "⭐".repeat(stars) : "☆☆☆";
}

export default function ChapterMapScreen() {
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

  const chapters = useMemo(() => chapterSummaries(progress), [progress]);
  const activeChapter = useMemo(() => currentChapter(progress), [progress]);

  function playChapter(chapter: ReturnType<typeof chapterSummaries>[number]) {
    if (!chapter.unlocked) {
      Alert.alert(
        "Chapter Locked",
        chapter.lockedReason || "Complete the previous chapter to unlock this one."
      );
      return;
    }

    if (chapter.availablePuzzleCount <= 0) {
      Alert.alert(
        "Content Missing",
        "This chapter has no puzzles imported yet. Import its chapter pack first."
      );
      return;
    }

    playSfx("tap");

    if (chapter.completed === 0) {
      router.push(`/chapter-intro?chapter=${chapter.id}` as any);
      return;
    }

    const nextIndex = nextChapterPuzzleIndex(chapter, progress);

    if (nextIndex < 0) {
      router.push(`/chapter-complete?chapter=${chapter.id}` as any);
      return;
    }

    router.push(`/play?mode=chapter&chapter=${chapter.id}&index=${nextIndex}` as any);
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Tanuki Town"
          subtitle="Restore cozy places with Pon, one chapter at a time."
        />

        <ResourceSummary progress={progress} compact />

        <View style={styles.pathCard}>
          <Text style={styles.pathTitle}>Current Journey</Text>
          <Text style={styles.pathSubtitle}>
            {activeChapter.emoji} {activeChapter.title}
          </Text>
          <Text style={styles.pathMeta}>
            {activeChapter.completed}/{activeChapter.total} puzzles · {activeChapter.completedRepairs}/5 restorations
          </Text>
        </View>

        <View style={styles.map}>
          {chapters.map((chapter, index) => {
            const isActive = chapter.id === activeChapter.id;
            const isLast = index === chapters.length - 1;

            return (
              <View key={chapter.id} style={styles.nodeWrap}>
                <Pressable
                  onPress={() => playChapter(chapter)}
                  style={[
                    styles.chapterNode,
                    isActive && styles.chapterNodeActive,
                    !chapter.unlocked && styles.chapterNodeLocked,
                    chapter.contentStatus !== "ready" &&
                      chapter.unlocked &&
                      styles.chapterNodeWarning,
                  ]}
                >
                  <View style={styles.nodeHeader}>
                    <Text style={styles.chapterEmoji}>{chapter.emoji}</Text>

                    <View style={styles.nodeTitleWrap}>
                      <Text style={styles.chapterTitle}>
                        {index + 1}. {chapter.title}
                      </Text>
                      <Text style={styles.chapterSubtitle} numberOfLines={2}>
                        {chapter.subtitle}
                      </Text>
                    </View>

                    <Text style={styles.statusEmoji}>{statusEmoji(chapter)}</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${chapter.progress}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.nodeFooter}>
                    <Text style={styles.statusText}>{statusText(chapter)}</Text>
                    <Text style={styles.starText}>{starText(chapter.stars)}</Text>
                  </View>

                  {chapter.unlocked && chapter.nextRepair && (
                    <Text style={styles.nextRepairText}>
                      Next restoration: {chapter.nextRepair.title} at {chapter.nextRepair.completedAt}
                    </Text>
                  )}

                  {chapter.unlocked && chapter.contentStatus !== "ready" && (
                    <Text style={styles.warningText}>
                      Imported puzzles: {chapter.availablePuzzleCount}/{chapter.total}
                    </Text>
                  )}
                </Pressable>

                {!isLast && <View style={styles.pathLine} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 40,
  },

  pathCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  pathTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  pathSubtitle: {
    marginTop: 4,
    fontSize: 23,
    fontWeight: "900",
    color: "#4B2E20",
  },

  pathMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#7B5A43",
  },

  map: {
    marginTop: 18,
  },

  nodeWrap: {
    alignItems: "center",
  },

  chapterNode: {
    width: "100%",
    padding: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },

  chapterNodeActive: {
    borderColor: "#FF5C8A",
    shadowColor: "#FF5C8A",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },

  chapterNodeLocked: {
    opacity: 0.52,
  },

  chapterNodeWarning: {
    borderColor: "#F59E0B",
  },

  nodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  chapterEmoji: {
    fontSize: 38,
  },

  nodeTitleWrap: {
    flex: 1,
  },

  chapterTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  chapterSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#7B5A43",
  },

  statusEmoji: {
    fontSize: 24,
  },

  progressTrack: {
    height: 10,
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  nodeFooter: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7B5A43",
  },

  starText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#F59E0B",
  },

  nextRepairText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
  },

  warningText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "900",
    color: "#B45309",
  },

  pathLine: {
    width: 5,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
