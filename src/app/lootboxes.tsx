import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { openLootBoxServer } from "@/lib/server-economy";
import {
  buyLootBox,
  lootBoxPrice,
  LootboxReward,
  openLootBox,
} from "@/lib/lootbox-service";
import { rarityEmoji, rarityLabel, LootBoxRarity } from "@/lib/lootbox-engine";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { avatarById } from "@/lib/avatars";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LastOpen = {
  rarity: LootBoxRarity;
  reward: LootboxReward;
};

export default function LootBoxesScreen() {
  useEffect(() => {
    loadGameAudio();
  }, []);

  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [lastOpen, setLastOpen] = useState<LastOpen | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const loaded = await loadProgress();
    setProgress(loaded);
  }

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function handleBuy() {
    const result = await buyLootBox();

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Not enough coins", result.message);
      return;
    }

    setNotice(result.message);
    setTimeout(() => setNotice(null), 1400);
    playSfx("coin");
    setLastOpen(null);
  }

  async function handleOpen() {
    try {
      const serverResult = await openLootBoxServer(progress);

      if (serverResult) {
        setProgress(serverResult.progress);

        playSfx("lootbox");

        setLastOpen({
          rarity: serverResult.rarity,
          reward: serverResult.reward,
        });

        setNotice("Crate opened!");
        setTimeout(() => setNotice(null), 1400);

        setTimeout(() => {
          playSfx("reward");
        }, 450);

        return;
      }
    } catch (error) {
      Alert.alert(
        "Server crate failed",
        error instanceof Error ? error.message : "Could not open crate."
      );
      return;
    }

    const result = await openLootBox();

    setProgress(result.progress);

    if (!result.success || !result.reward || !result.rarity) {
      Alert.alert("No Crates", result.message);
      return;
    }

    playSfx("lootbox");

    setLastOpen({
      rarity: result.rarity,
      reward: result.reward,
    });

    setNotice("Crate opened!");
    setTimeout(() => setNotice(null), 1400);

    setTimeout(() => {
      playSfx("reward");
    }, 450);
  }

  const price = lootBoxPrice(progress);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Loot Boxes"
          subtitle="Open cozy crates for coins, avatars, and rare titles."
        />
        <ResourceSummary progress={progress} notice={notice} compact />

        <View style={styles.heroCard}>
          <Image
            source={require("../../assets/ui/crate.png")}
            style={styles.crateImage}
            resizeMode="contain"
          />
          <Text style={styles.crateTitle}>Cozy Crate</Text>
          <Text style={styles.crateMeta}>
            Owned: {progress.lootBoxes || 0} · Coins: {progress.coins || 0}
          </Text>
        </View>

        {lastOpen && (
          <View style={styles.rewardCard}>
            <Text style={styles.rewardRarity}>
              {rarityEmoji(lastOpen.rarity)} {rarityLabel(lastOpen.rarity)}
            </Text>

            <View style={styles.rewardImageWrap}>
              {lastOpen.reward.type === "coins" ? (
                <Image
                  source={require("../../assets/ui/coin.png")}
                  style={styles.rewardImage}
                  resizeMode="contain"
                />
              ) : lastOpen.reward.type === "avatar" ? (
                <Image
                  source={avatarById(lastOpen.reward.avatarId).image}
                  style={styles.rewardImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.rewardEmoji}>{lastOpen.reward.emoji}</Text>
              )}
            </View>
            <Text style={styles.rewardTitle}>{lastOpen.reward.label}</Text>

            <Text style={styles.rewardMeta}>
              {lastOpen.reward.type === "coins"
                ? `+${lastOpen.reward.amount} coins`
                : lastOpen.reward.type === "avatar"
                  ? "Avatar unlocked and equipped"
                  : "Title unlocked and equipped"}
            </Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={handleOpen}>
            <Text style={styles.primaryButtonText}>Open Crate</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleBuy}>
            <Text style={styles.secondaryButtonText}>
              Buy Crate · 🪙 {price}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Possible Rewards</Text>
          <Text style={styles.infoText}>🪙 Coins</Text>
          <Text style={styles.infoText}>🎭 Avatars</Text>
          <Text style={styles.infoText}>🏆 Titles</Text>
          <Text style={styles.infoFinePrint}>
            Duplicate protection converts unavailable drops into coins.
          </Text>
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
    color: "rgba(255,255,255,0.92)",
  },

  heroCard: {
    alignItems: "center",
    padding: 26,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  crateImage: {
    width: 132,
    height: 132,
  },

  crateTitle: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "900",
    color: "#4B2E20",
  },

  crateMeta: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "800",
    color: "#7B5A43",
  },

  rewardCard: {
    marginTop: 16,
    alignItems: "center",
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#FF5C8A",
  },

  rewardRarity: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },

  rewardImageWrap: {
    marginTop: 8,
    minHeight: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  rewardImage: {
    width: 82,
    height: 82,
  },

  rewardEmoji: {
    fontSize: 54,
  },

  rewardTitle: {
    marginTop: 8,
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  rewardMeta: {
    marginTop: 6,
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  buttonGroup: {
    marginTop: 18,
    gap: 12,
  },

  primaryButton: {
    backgroundColor: "#FF5C8A",
    paddingVertical: 17,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
    fontWeight: "900",
  },

  infoCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "white",
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#7B5A43",
    marginTop: 4,
  },

  infoFinePrint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#9B745A",
  },
});
