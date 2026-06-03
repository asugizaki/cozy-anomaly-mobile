import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import { claimEventTaskRewardServer } from "@/lib/server-economy";
import {
  ACTIVE_EVENT,
  activeEventTasks,
  claimEventTask,
  EventTask,
} from "@/lib/events";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function rewardText(task: EventTask) {
  const parts = [];

  if (task.reward.xp) parts.push(`${task.reward.xp} XP`);
  if (task.reward.coins) parts.push(`${task.reward.coins} coins`);
  if (task.reward.energy) parts.push(`${task.reward.energy} energy`);
  if (task.reward.lootBoxes) parts.push(`${task.reward.lootBoxes} crates`);

  return parts.join(" · ");
}

export default function EventScreen() {
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

  async function claim(taskId: string) {
    try {
      const serverResult = await claimEventTaskRewardServer(
        ACTIVE_EVENT.id,
        taskId,
        progress
      );

      if (serverResult) {
        setProgress(serverResult.progress);
        setNotice("Event reward claimed!");
        setTimeout(() => setNotice(null), 1400);
        playSfx("reward");
        return;
      }
    } catch (error) {
      Alert.alert(
        "Server claim failed",
        error instanceof Error ? error.message : "Could not claim event reward."
      );
      return;
    }

    const result = await claimEventTask(taskId);

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Event", result.message);
      return;
    }

    setNotice("Event reward claimed!");
    setTimeout(() => setNotice(null), 1400);
    playSfx("reward");
  }

  const tasks = activeEventTasks(progress);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.eventEmoji}>🎉</Text>
          <Text style={styles.title}>{ACTIVE_EVENT.title}</Text>
          <Text style={styles.subtitle}>{ACTIVE_EVENT.subtitle}</Text>
        </View>

        <ResourceSummary progress={progress} notice={notice} compact />

        <View style={styles.list}>
          {tasks.map((task) => {
            const percent = task.target
              ? Math.round((task.current / task.target) * 100)
              : 0;

            return (
              <View key={task.id} style={styles.card}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <Text style={styles.cardDescription}>{task.description}</Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percent, 100)}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.progressText}>
                  {task.current}/{task.target}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.rewardText}>{rewardText(task)}</Text>

                  <Pressable
                    disabled={!task.completed || task.claimed}
                    style={[
                      styles.claimButton,
                      (!task.completed || task.claimed) &&
                        styles.disabledButton,
                    ]}
                    onPress={() => claim(task.id)}
                  >
                    <Text style={styles.claimButtonText}>
                      {task.claimed
                        ? "Claimed"
                        : task.completed
                          ? "Claim"
                          : "Locked"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AppBackground>
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
    color: "#4B2E20",
  },

  heroCard: {
    padding: 24,
    borderRadius: 30,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
    marginBottom: 18,
  },

  eventEmoji: {
    fontSize: 52,
  },

  title: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    color: "rgba(255,255,255,0.86)",
    textAlign: "center",
  },

  list: {
    gap: 14,
  },

  card: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#7B5A43",
  },

  progressTrack: {
    height: 10,
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.14)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  progressText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  cardFooter: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },

  rewardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: "#7B5A43",
  },

  claimButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  claimButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.45,
  },
});
