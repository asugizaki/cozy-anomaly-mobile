import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  chapterSummaries,
  nextChapterPuzzleIndex,
} from "@/lib/chapters";
import { readyRepairRewards } from "@/lib/restoration";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ChaptersScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgressWithEnergy().then(setProgress);
    }, [])
  );

  const chapters = useMemo(() => chapterSummaries(progress), [progress]);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Hidden Tanuki"
          subtitle="Restore cozy Japanese spaces by finding tiny anomalies."
        />

        <ResourceSummary progress={progress} compact />

        <View style={styles.introCard}>
          <Text style={styles.tanuki}>🦝</Text>
          <View style={styles.introTextWrap}>
            <Text style={styles.introTitle}>Tanuki's Restoration Map</Text>
            <Text style={styles.introText}>
              Complete puzzles to repair each chapter. Every 20 clears restores
              part of the scene and unlocks a bonus moment.
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {chapters.map((chapter) => {
            const nextIndex = nextChapterPuzzleIndex(chapter, progress);

            return (
              <View
                key={chapter.id}
                style={[
                  styles.chapterCard,
                  !chapter.unlocked && styles.lockedCard,
                ]}
              >
                <View style={styles.chapterHeader}>
                  <Text style={styles.chapterEmoji}>{chapter.emoji}</Text>

                  <View style={styles.chapterTitleWrap}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterSubtitle}>
                      {chapter.subtitle}
                    </Text>
                  </View>

                  <Text style={styles.percent}>{chapter.progress}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${chapter.progress}%` },
                    ]}
                  />
                </View>

                <Text style={styles.progressText}>
                  {chapter.completed}/{chapter.total} puzzles complete
                </Text>

                <View style={styles.repairsGrid}>
                  {chapter.repairs.map((repair) => {
                    const complete = chapter.completed >= repair.completedAt;

                    return (
                      <View
                        key={repair.id}
                        style={[
                          styles.repairPill,
                          complete && styles.repairPillComplete,
                        ]}
                      >
                        <Text style={styles.repairEmoji}>
                          {complete ? repair.afterEmoji : repair.beforeEmoji}
                        </Text>
                        <Text
                          style={[
                            styles.repairText,
                            complete && styles.repairTextComplete,
                          ]}
                          numberOfLines={1}
                        >
                          {repair.completedAt}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.chapterFooter}>
                  <View style={styles.nextRepairBox}>
                    <Text style={styles.nextRepairLabel}>
                      {chapter.fullyRestored
                        ? "Restored"
                        : chapter.nextRepair
                          ? `Next: ${chapter.nextRepair.title}`
                          : "Final repairs"}
                    </Text>
                    <Text style={styles.nextRepairText}>
                      {chapter.fullyRestored
                        ? chapter.completionText
                        : chapter.nextRepair?.description || chapter.intro}
                    </Text>
                  </View>

                  {chapter.unlocked ? (
                    <Link
                      href={`/chapter-detail?id=${chapter.id}`}
                      asChild
                    >
                      <Pressable style={styles.playButton}>
                        <Text style={styles.playButtonText}>
                          {chapter.fullyRestored ? "View" : "Restore"}
                        </Text>
                      </Pressable>
                    </Link>
                  ) : (
                    <Pressable style={[styles.playButton, styles.disabled]}>
                      <Text style={styles.playButtonText}>Locked</Text>
                    </Pressable>
                  )}
                </View>

                {readyRepairRewards(chapter, progress).length > 0 && (
                  <Pressable
                    style={styles.bonusCard}
                    onPress={() =>
                      router.push(`/chapter-detail?id=${chapter.id}` as any)
                    }
                  >
                    <Text style={styles.bonusText}>
                      🛠 Repair reward ready
                    </Text>
                  </Pressable>
                )}
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
    padding: 20,
    paddingBottom: 36,
  },

  introCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    marginBottom: 14,
  },

  tanuki: {
    fontSize: 42,
  },

  introTextWrap: {
    flex: 1,
  },

  introTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  introText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#7B5A43",
  },

  list: {
    gap: 14,
  },

  chapterCard: {
    padding: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  lockedCard: {
    opacity: 0.6,
  },

  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  chapterEmoji: {
    fontSize: 36,
  },

  chapterTitleWrap: {
    flex: 1,
  },

  chapterTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#4B2E20",
  },

  chapterSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#7B5A43",
  },

  percent: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  progressTrack: {
    height: 10,
    marginTop: 14,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#F1D7C2",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },

  progressText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#7B5A43",
  },

  repairsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  repairPill: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#F6E1D0",
    alignItems: "center",
    justifyContent: "center",
  },

  repairPillComplete: {
    backgroundColor: "#DCFCE7",
  },

  repairEmoji: {
    fontSize: 22,
  },

  repairText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "900",
    color: "#7B5A43",
  },

  repairTextComplete: {
    color: "#166534",
  },

  chapterFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    alignItems: "center",
  },

  nextRepairBox: {
    flex: 1,
  },

  nextRepairLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#4B2E20",
  },

  nextRepairText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#7B5A43",
  },

  playButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  playButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },

  disabled: {
    backgroundColor: "#9CA3AF",
  },

  bonusCard: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
  },

  bonusText: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "900",
  },
});
