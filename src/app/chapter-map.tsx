import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  chapterSummaries,
  currentChapter,
  nextChapterPuzzleIndex,
} from "@/lib/chapters";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import { loadGameAudio, playSfx } from "@/lib/audio";
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
  if (chapter.completed === 0) return "New";
  return `${chapter.completed}/${chapter.total}`;
}

function statusEmoji(chapter: ReturnType<typeof chapterSummaries>[number]) {
  if (chapter.fullyRestored) return "✅";
  if (!chapter.unlocked) return "🔒";
  if (chapter.completed === 0) return "✨";
  return "▶";
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
        "Complete the previous chapter to unlock this one."
      );
      return;
    }

    playSfx("tap");

    if (chapter.completed === 0) {
      router.push(`/chapter-intro?chapter=${chapter.id}`);
      return;
    }

    const nextIndex = nextChapterPuzzleIndex(chapter, progress);

    if (nextIndex < 0) {
      router.push(`/chapter-complete?chapter=${chapter.id}`);
      return;
    }

    router.push(`/play?mode=chapter&chapter=${chapter.id}&index=${nextIndex}`);
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Chapter Map"
          subtitle="Restore cozy places with Tanuki, one chapter at a time."
        />

        <ResourceSummary progress={progress} compact />

        <View style={styles.pathCard}>
          <Text style={styles.pathTitle}>Current Journey</Text>
          <Text style={styles.pathSubtitle}>
            {activeChapter.emoji} {activeChapter.title}
          </Text>
        </View>

        <View style={styles.map}>
          {chapters.map((chapter, index) => {
            const isActive = chapter.id === activeChapter.id;
            const isLast = index === chapters.length - 1;

            return (
              <View key={chapter.id}>
                <Pressable
                  style={[
                    styles.chapterNode,
                    chapter.fullyRestored && styles.completeNode,
                    isActive && styles.activeNode,
                    !chapter.unlocked && styles.lockedNode,
                  ]}
                  onPress={() => playChapter(chapter)}
                >
                  <View style={styles.nodeIconWrap}>
                    <Text style={styles.nodeIcon}>{chapter.emoji}</Text>
                    <Text style={styles.statusBubble}>
                      {statusEmoji(chapter)}
                    </Text>
                  </View>

                  <View style={styles.nodeTextWrap}>
                    <Text style={styles.nodeKicker}>Chapter {index + 1}</Text>
                    <Text style={styles.nodeTitle}>{chapter.title}</Text>
                    <Text style={styles.nodeSubtitle}>{chapter.subtitle}</Text>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${chapter.progress}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.nodeStatus}>{statusText(chapter)}</Text>
                  </View>
                </Pressable>

                {!isLast && (
                  <View
                    style={[
                      styles.pathLine,
                      chapter.fullyRestored && styles.pathLineComplete,
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => playChapter(activeChapter)}
        >
          <Text style={styles.primaryButtonText}>Continue Journey</Text>
        </Pressable>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 36,
  },

  pathCard: {
    marginTop: 14,
    padding: 17,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },

  pathTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  pathSubtitle: {
    marginTop: 3,
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
  },

  map: {
    marginTop: 18,
  },

  chapterNode: {
    flexDirection: "row",
    gap: 14,
    padding: 15,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },

  activeNode: {
    borderColor: "#FF5C8A",
    backgroundColor: "rgba(255,247,236,0.97)",
  },

  completeNode: {
    borderColor: "#22C55E",
  },

  lockedNode: {
    opacity: 0.52,
  },

  nodeIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  nodeIcon: {
    fontSize: 30,
  },

  statusBubble: {
    position: "absolute",
    right: -4,
    bottom: -4,
    fontSize: 18,
  },

  nodeTextWrap: {
    flex: 1,
  },

  nodeKicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#A16207",
    textTransform: "uppercase",
  },

  nodeTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  nodeSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#7B5A43",
  },

  progressTrack: {
    marginTop: 10,
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.14)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  nodeStatus: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: "900",
    color: "#7B5A43",
  },

  pathLine: {
    width: 6,
    height: 24,
    marginLeft: 41,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  pathLineComplete: {
    backgroundColor: "#22C55E",
  },

  primaryButton: {
    marginTop: 20,
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
});
