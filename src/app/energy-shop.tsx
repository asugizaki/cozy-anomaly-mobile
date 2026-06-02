import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { loadGameAudio, playSfx } from "@/lib/audio";
import {
  buyEnergyPack,
  loadProgressWithEnergy,
  MAX_DAILY_ENERGY_ADS,
  secondsUntilNextEnergy,
  watchAdForEnergy,
} from "@/lib/energy";
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

const PACKS = [
  {
    id: "small",
    label: "+5 Energy",
    amount: 5,
    cost: 100,
  },
  {
    id: "medium",
    label: "+10 Energy",
    amount: 10,
    cost: 175,
  },
  {
    id: "large",
    label: "+20 Energy",
    amount: 20,
    cost: 300,
  },
];

function formatTimer(seconds: number) {
  if (seconds <= 0) return "Ready";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${`${remainingSeconds}`.padStart(2, "0")}`;
}

export default function EnergyShopScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [nextEnergySeconds, setNextEnergySeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const loaded = await loadProgressWithEnergy();

    setProgress(loaded);
    setNextEnergySeconds(secondsUntilNextEnergy(loaded));
  }

  useEffect(() => {
    loadGameAudio();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();

      const timer = setInterval(refresh, 1000);

      return () => clearInterval(timer);
    }, [])
  );

  async function handleAdRefill() {
    const result = await watchAdForEnergy();

    setProgress(result.progress);
    setNextEnergySeconds(secondsUntilNextEnergy(result.progress));

    if (!result.success) {
      Alert.alert("Energy Refill", result.message);
      return;
    }

    setNotice(result.message);
    setTimeout(() => setNotice(null), 1400);
    playSfx("reward");
  }

  async function handleBuy(amount: number, cost: number) {
    const result = await buyEnergyPack(amount, cost);

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Energy Pack", result.message);
      return;
    }

    setNotice(result.message);
    setTimeout(() => setNotice(null), 1400);
    playSfx("coin");
  }

  const adViews = progress.energyAdViewsToday || 0;
  const adLimitReached = adViews >= MAX_DAILY_ENERGY_ADS;
  const canWatchAd = (progress.energy || 0) <= 0 && !adLimitReached;

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
          <Text style={styles.energyEmoji}>⚡</Text>
          <Text style={styles.title}>Energy</Text>

          <Text style={styles.energyAmount}>
            {progress.energy || 0}/{progress.maxEnergy || 20}
          </Text>

          <Text style={styles.subtitle}>
            Next energy: {formatTimer(nextEnergySeconds)}
          </Text>
        </View>
        <ResourceSummary progress={progress} notice={notice} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rewarded Ad Refill</Text>
          <Text style={styles.cardDescription}>
            Available only when energy is empty. Limit {MAX_DAILY_ENERGY_ADS} per day.
          </Text>

          <Pressable
            disabled={!canWatchAd}
            style={[styles.primaryButton, !canWatchAd && styles.disabledButton]}
            onPress={handleAdRefill}
          >
            <Text style={styles.primaryButtonText}>
              Watch Ad · +5 Energy ({adViews}/{MAX_DAILY_ENERGY_ADS})
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Energy Packs</Text>

        <View style={styles.packList}>
          {PACKS.map((pack) => (
            <View key={pack.id} style={styles.packCard}>
              <View>
                <Text style={styles.packTitle}>{pack.label}</Text>
                <Text style={styles.packMeta}>Cost: {pack.cost} coins</Text>
              </View>

              <Pressable
                disabled={(progress.coins || 0) < pack.cost}
                style={[
                  styles.buyButton,
                  (progress.coins || 0) < pack.cost && styles.disabledButton,
                ]}
                onPress={() => handleBuy(pack.amount, pack.cost)}
              >
                <Text style={styles.buyButtonText}>
                  {(progress.coins || 0) < pack.cost ? "Need Coins" : "Buy"}
                </Text>
              </Pressable>
            </View>
          ))}
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
    alignItems: "center",
    padding: 24,
    borderRadius: 30,
    backgroundColor: "#FF5C8A",
    marginBottom: 18,
  },

  energyEmoji: {
    fontSize: 58,
  },

  title: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "900",
    color: "white",
  },

  energyAmount: {
    marginTop: 8,
    fontSize: 38,
    fontWeight: "900",
    color: "white",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "rgba(255,255,255,0.86)",
  },

  card: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: "white",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardDescription: {
    marginTop: 5,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#7B5A43",
  },

  primaryButton: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.45,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "900",
    color: "#4B2E20",
  },

  packList: {
    gap: 12,
  },

  packCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderRadius: 24,
    backgroundColor: "white",
  },

  packTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  packMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#7B5A43",
  },

  buyButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#16a34a",
  },

  buyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },

  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#F6E1D0",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 14,
    fontWeight: "900",
  },
});
