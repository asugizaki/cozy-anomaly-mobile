import { grantRewardMultiplier, MultiplierReward, RewardMultiplierSource, rewardSummary } from "@/lib/reward-multiplier";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  source: RewardMultiplierSource;
  reward: MultiplierReward;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  onClaimed?: (progress: any) => void;
};

export function RewardMultiplierCard({
  source,
  reward,
  metadata,
  onClaimed,
}: Props) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasReward = Object.values(reward).some((value) => Number(value || 0) > 0);

  if (!hasReward || claimed) return null;

  async function claimMultiplier() {
    if (loading) return;

    setLoading(true);

    const result = await grantRewardMultiplier({
      source,
      reward,
      metadata,
    });

    setLoading(false);

    if (!result.success) return;

    setClaimed(true);
    onClaimed?.(result.progress);

    Alert.alert("Bonus Claimed!", `Extra reward added:\n${result.message}`);
  }

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>Double your reward?</Text>
        <Text style={styles.subtitle}>
          Watch an ad to get extra: {rewardSummary(reward)}
        </Text>
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={claimMultiplier}
      >
        <Text style={styles.buttonText}>
          {loading ? "Loading..." : "🎬 2x Reward"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },

  copy: {
    gap: 3,
  },

  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400E",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#7C2D12",
    textAlign: "center",
  },

  button: {
    marginTop: 9,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#F59E0B",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
});
