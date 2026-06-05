import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { RestorationScene } from "@/components/RestorationScene";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  chapterById,
  chapterSummary,
  nextChapterPuzzleIndex,
} from "@/lib/chapters";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import {
  claimChapterRepairReward,
  readyRepairRewards,
  repairRewardForMilestone,
  repairRewardId,
  tanukiLineForChapter,
} from "@/lib/restoration";
import { restorationBundleByChapterId } from "@/data/generatedRestorations";
import { Link, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function rewardText(repairCompletedAt: number) {
  const reward = repairRewardForMilestone(repairCompletedAt);
  const parts = [`${reward.xp} XP`, `${reward.coins} coins`];

  if (reward.lootBoxes) parts.push(`${reward.lootBoxes} crate`);

  return parts.join(" · ");
}

export default function ChapterDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const chapterDef = chapterById(String(params.id || "matcha_cafe"));

  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadGameAudio();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressWithEnergy().then(setProgress);
    }, [])
  );

  const chapter = useMemo(
    () => chapterSummary(chapterDef, progress, true),
    [chapterDef.id, progress]
  );

  const nextIndex = nextChapterPuzzleIndex(chapter, progress);
  const restorationBundle = restorationBundleByChapterId(chapter.id);
  const readyRewards = readyRepairRewards(chapter, progress);
  const claimed = new Set(progress.claimedChapterRepairRewardIds || []);

  async function claimRepair(repairId: string) {
    const result = await claimChapterRepairReward(chapter.id, repairId);

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Repair", result.message);
      return;
    }

    setNotice(result.message);
    setTimeout(() => setNotice(null), 1600);
    playSfx("reward");
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={chapter.title}
          subtitle={chapter.subtitle}
        />

        <ResourceSummary progress={progress} notice={notice} compact />

        {restorationBundle ? (
          <RestorationScene
            bundle={restorationBundle}
            chapter={chapter}
            progress={progress}
          />
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.roomEmoji}>{chapter.emoji}</Text>

              <View style={styles.roomText}>
                <Text style={styles.roomTitle}>
                  {chapter.fullyRestored
                    ? "Fully Restored"
                    : "Restoration Progress"}
                </Text>
                <Text style={styles.roomSubtitle}>
                  {chapter.progress}% complete
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${chapter.progress}%` },
                ]}
              />
            </View>

            <View style={styles.tanukiCard}>
              <Text style={styles.tanukiEmoji}>🦝</Text>
              <View style={styles.tanukiTextWrap}>
                <Text style={styles.tanukiName}>Tanuki</Text>
                <Text style={styles.tanukiText}>
                  {tanukiLineForChapter(chapter)}
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.repairList}>
          {chapter.repairs.map((repair) => {
            const complete = chapter.completed >= repair.completedAt;
            const rewardId = repairRewardId(chapter.id, repair.id);
            const isClaimed = claimed.has(rewardId);
            const canClaim = complete && !isClaimed;

            return (
              <View
                key={repair.id}
                style={[
                  styles.repairCard,
                  complete && styles.repairCardComplete,
                ]}
              >
                <View style={styles.repairHeader}>
                  <Text style={styles.repairEmoji}>
                    {complete ? repair.afterEmoji : repair.beforeEmoji}
                  </Text>

                  <View style={styles.repairTitleWrap}>
                    <Text style={styles.repairTitle}>{repair.title}</Text>
                    <Text style={styles.repairDescription}>
                      {repair.description}
                    </Text>
                  </View>

                  <Text style={styles.repairCount}>{repair.completedAt}</Text>
                </View>

                <View style={styles.repairFooter}>
                  <Text style={styles.rewardText}>
                    {complete
                      ? isClaimed
                        ? "Reward claimed"
                        : rewardText(repair.completedAt)
                      : `${Math.max(0, repair.completedAt - chapter.completed)} puzzles left`}
                  </Text>

                  {canClaim ? (
                    <Pressable
                      style={styles.claimButton}
                      onPress={() => claimRepair(repair.id)}
                    >
                      <Text style={styles.claimButtonText}>Fix It</Text>
                    </Pressable>
                  ) : (
                    <View
                      style={[
                        styles.statusPill,
                        isClaimed && styles.statusPillClaimed,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {isClaimed ? "Fixed" : complete ? "Ready" : "Locked"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {readyRewards.length > 0 && (
          <View style={styles.bonusPrompt}>
            <Text style={styles.bonusTitle}>Bonus unlocked</Text>
            <Text style={styles.bonusText}>
              Claim a repair to trigger Tanuki's bonus reward moment.
            </Text>
          </View>
        )}

        <View style={styles.bottomActions}>
          <Link
            href={`/play?mode=chapter&chapter=${chapter.id}&index=${nextIndex}`}
            asChild
          >
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {chapter.fullyRestored ? "Review Chapter" : "Continue Puzzle"}
              </Text>
            </Pressable>
          </Link>

          <Link href="/bonus-tanuki" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Find the Tanuki</Text>
            </Pressable>
          </Link>
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

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.94)",
  },

  roomEmoji: {
    fontSize: 54,
  },

  roomText: {
    flex: 1,
  },

  roomTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
  },

  roomSubtitle: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  progressTrack: {
    height: 12,
    marginTop: 12,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.70)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },

  tanukiCard: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "#FEF3C7",
  },

  tanukiEmoji: {
    fontSize: 40,
  },

  tanukiTextWrap: {
    flex: 1,
  },

  tanukiName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400E",
  },

  tanukiText: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7C2D12",
  },

  repairList: {
    gap: 12,
    marginTop: 14,
  },

  repairCard: {
    padding: 15,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.93)",
  },

  repairCardComplete: {
    backgroundColor: "rgba(240,253,244,0.96)",
  },

  repairHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  repairEmoji: {
    fontSize: 34,
  },

  repairTitleWrap: {
    flex: 1,
  },

  repairTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4B2E20",
  },

  repairDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#7B5A43",
  },

  repairCount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  repairFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  rewardText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: "#7B5A43",
  },

  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },

  claimButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },

  statusPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },

  statusPillClaimed: {
    backgroundColor: "#DCFCE7",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#4B2E20",
  },

  bonusPrompt: {
    marginTop: 14,
    padding: 15,
    borderRadius: 24,
    backgroundColor: "#FFE4E6",
  },

  bonusTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9F1239",
  },

  bonusText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#9F1239",
  },

  bottomActions: {
    marginTop: 18,
    gap: 10,
  },

  primaryButton: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#4B2E20",
    fontSize: 15,
    fontWeight: "900",
  },
});
