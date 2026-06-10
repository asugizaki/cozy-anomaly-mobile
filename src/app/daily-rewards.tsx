import { RewardMultiplierCard } from "@/components/RewardMultiplierCard";
import {
  claimDailyReward,
  DAILY_REWARD_TRACK,
  dailyRewardForDay,
  loadDailyRewardState,
  nextDailyRewardState,
} from "@/lib/daily-rewards";
import { loadProgressWithEnergy } from "@/lib/energy";
import { DEFAULT_PROGRESS, PlayerProgress } from "@/lib/player-progress";
import { rewardSummary } from "@/lib/reward-multiplier";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DailyRewardsScreen() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [state, setState] = useState({
    lastClaimedDate: undefined as string | undefined,
    streakDay: 0,
    claimedDates: [] as string[],
  });
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [nextProgress, rewardState] = await Promise.all([
          loadProgressWithEnergy(),
          loadDailyRewardState(),
        ]);

        setProgress(nextProgress);
        setState(rewardState);
      }

      load();
    }, [])
  );

  const claimState = useMemo(() => nextDailyRewardState(state), [state]);
  const todayReward = claimState.reward || dailyRewardForDay(1);

  async function claimReward() {
    if (claiming) return;

    if (!claimState.canClaim) {
      Alert.alert("Already claimed", "Come back tomorrow for the next gift.");
      return;
    }

    setClaiming(true);

    const result = await claimDailyReward();

    setClaiming(false);

    if (result.progress) setProgress(result.progress);
    setState(result.state);
    setClaimedReward(result.reward);

    Alert.alert("Daily Gift Claimed!", `${rewardSummary(result.reward)} added.`);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/")}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Daily Gift</Text>
          <Text style={styles.subtitle}>Pon saved something for you.</Text>
        </View>
      </View>

      <View style={styles.ponCard}>
        <Text style={styles.pon}>🦝</Text>
        <View style={styles.ponTextWrap}>
          <Text style={styles.ponTitle}>
            {claimState.canClaim ? "Welcome back!" : "Gift claimed!"}
          </Text>
          <Text style={styles.ponText}>
            {claimState.canClaim
              ? `Claim Day ${claimState.nextStreakDay} and keep restoring the town.`
              : "Come back tomorrow and your streak will continue."}
          </Text>
        </View>
      </View>

      <View style={styles.todayCard}>
        <Text style={styles.cardKicker}>Today's Gift</Text>
        <Text style={styles.todayTitle}>Day {claimState.nextStreakDay}</Text>
        <Text style={styles.todayReward}>{rewardSummary(todayReward)}</Text>

        <Pressable
          style={[
            styles.claimButton,
            !claimState.canClaim && styles.claimButtonDisabled,
          ]}
          onPress={claimReward}
          disabled={claiming}
        >
          <Text style={styles.claimButtonText}>
            {claiming
              ? "Claiming..."
              : claimState.canClaim
                ? "Claim Gift"
                : "Claimed Today"}
          </Text>
        </Pressable>

        {claimedReward && (
          <RewardMultiplierCard
            source="daily_gift"
            reward={claimedReward}
            metadata={{ streakDay: state.streakDay }}
            onClaimed={setProgress}
          />
        )}
      </View>

      <View style={styles.trackCard}>
        <Text style={styles.trackTitle}>7-Day Track</Text>

        <View style={styles.trackGrid}>
          {DAILY_REWARD_TRACK.map((reward) => {
            const currentDay = ((claimState.nextStreakDay - 1) % 7) + 1;
            const isCurrent = reward.day === currentDay;

            return (
              <View
                key={reward.day}
                style={[
                  styles.dayCard,
                  isCurrent && styles.dayCardCurrent,
                ]}
              >
                <Text style={styles.dayNumber}>Day {reward.day}</Text>
                <Text style={styles.dayReward}>{rewardSummary(reward)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.resources}>
        <Text style={styles.resourceText}>⚡ {progress.energy}/{progress.maxEnergy}</Text>
        <Text style={styles.resourceText}>🪙 {progress.coins}</Text>
        <Text style={styles.resourceText}>🎁 {progress.lootBoxes}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18, backgroundColor: "#FFF3E2" },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  backButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 40, color: "#4B2E20", marginTop: -5 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 32, fontWeight: "900", color: "#4B2E20" },
  subtitle: { marginTop: 2, fontSize: 14, fontWeight: "800", color: "#7B5A43" },
  ponCard: { marginTop: 20, padding: 16, borderRadius: 26, backgroundColor: "white", flexDirection: "row", alignItems: "center", gap: 14 },
  pon: { fontSize: 56 },
  ponTextWrap: { flex: 1 },
  ponTitle: { fontSize: 20, fontWeight: "900", color: "#4B2E20" },
  ponText: { marginTop: 4, fontSize: 14, lineHeight: 20, fontWeight: "800", color: "#7B5A43" },
  todayCard: { marginTop: 18, padding: 18, borderRadius: 30, backgroundColor: "#4B2E20", alignItems: "center" },
  cardKicker: { fontSize: 12, fontWeight: "900", color: "#FCD34D", textTransform: "uppercase", letterSpacing: 0.8 },
  todayTitle: { marginTop: 4, fontSize: 30, fontWeight: "900", color: "white" },
  todayReward: { marginTop: 8, fontSize: 21, fontWeight: "900", color: "#FFEDD5" },
  claimButton: { marginTop: 16, width: "100%", paddingVertical: 15, borderRadius: 999, backgroundColor: "#FF5C8A", alignItems: "center" },
  claimButtonDisabled: { backgroundColor: "#9CA3AF" },
  claimButtonText: { color: "white", fontSize: 17, fontWeight: "900" },
  trackCard: { marginTop: 18, padding: 16, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.82)" },
  trackTitle: { fontSize: 17, fontWeight: "900", color: "#4B2E20" },
  trackGrid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayCard: { width: "31.5%", padding: 10, borderRadius: 16, backgroundColor: "#F4D7C4", minHeight: 72 },
  dayCardCurrent: { borderWidth: 3, borderColor: "#FF5C8A", backgroundColor: "#FFE4EC" },
  dayNumber: { fontSize: 12, fontWeight: "900", color: "#4B2E20" },
  dayReward: { marginTop: 5, fontSize: 12, lineHeight: 16, fontWeight: "900", color: "#7B5A43" },
  resources: { marginTop: "auto", paddingTop: 14, flexDirection: "row", justifyContent: "center", gap: 10 },
  resourceText: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "white", color: "#4B2E20", fontSize: 13, fontWeight: "900" },
});
