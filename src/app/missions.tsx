import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  claimDailyMission,
  dailyMissions,
  Mission,
} from "@/lib/missions";
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

function rewardText(mission: Mission) {
  const parts = [];

  if (mission.reward.xp) parts.push(`${mission.reward.xp} XP`);
  if (mission.reward.coins) parts.push(`${mission.reward.coins} coins`);
  if (mission.reward.energy) parts.push(`${mission.reward.energy} energy`);
  if (mission.reward.lootBoxes) parts.push(`${mission.reward.lootBoxes} crate`);

  return parts.join(" · ");
}

export default function MissionsScreen() {
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

  async function claim(missionId: string) {
    const result = await claimDailyMission(missionId);

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Mission", result.message);
      return;
    }

    setNotice("Mission reward claimed!");
    setTimeout(() => setNotice(null), 1400);
    playSfx("reward");
  }

  const missions = dailyMissions(progress);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Daily Missions"
          subtitle="Finish daily goals for bonus rewards."
        />
        <ResourceSummary progress={progress} notice={notice} compact />

        <View style={styles.list}>
          {missions.map((mission) => {
            const percent = mission.target
              ? Math.round((mission.current / mission.target) * 100)
              : 0;

            return (
              <View key={mission.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{mission.title}</Text>
                    <Text style={styles.cardDescription}>
                      {mission.description}
                    </Text>
                  </View>

                  <Text style={styles.progressText}>
                    {mission.current}/{mission.target}
                  </Text>
                </View>

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

                <View style={styles.cardFooter}>
                  <Text style={styles.rewardText}>{rewardText(mission)}</Text>

                  <Pressable
                    disabled={!mission.completed || mission.claimed}
                    style={[
                      styles.claimButton,
                      (!mission.completed || mission.claimed) &&
                        styles.disabledButton,
                    ]}
                    onPress={() => claim(mission.id)}
                  >
                    <Text style={styles.claimButtonText}>
                      {mission.claimed
                        ? "Claimed"
                        : mission.completed
                          ? "Claim"
                          : "In Progress"}
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
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  cardText: {
    flex: 1,
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

  progressText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FF5C8A",
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
