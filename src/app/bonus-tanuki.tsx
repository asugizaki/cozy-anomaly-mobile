import {
  randomBonusTanukiScene,
  BonusTanukiScene,
} from "@/data/generatedBonusTanukiScenes";
import { claimBonusTanukiReward } from "@/lib/bonus-tanuki";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import { DEFAULT_PROGRESS, PlayerProgress } from "@/lib/player-progress";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FALLBACK_SCENE: BonusTanukiScene = {
  id: "fallback_bonus",
  title: "Bonus Tanuki",
  chapter_id: "",
  background: "",
  backgroundSource: require("../../assets/home-bg.png"),
  canvas: { width: 900, height: 1600 },
  target: { x: 0.5, y: 0.55, radius: 0.09 },
  attempts: 3,
  reward: {
    xp: 200,
    coins: 250,
    energy: 1,
    lootBoxChance: 0.25,
    rareAvatarChance: 0.05,
  },
};

function continueRoute(next?: string, chapter?: string) {
  if (next === "chapter-complete" && chapter) {
    return `/chapter-complete?chapter=${chapter}`;
  }

  if (next === "chapter-map") {
    return "/chapter-map";
  }

  if (chapter) {
    return `/play?mode=chapter&chapter=${chapter}`;
  }

  return "/";
}

export default function BonusTanukiScreen() {
  const params = useLocalSearchParams<{
    chapter?: string;
    next?: string;
  }>();

  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [found, setFound] = useState(false);
  const [rewardText, setRewardText] = useState("");
  const [scene] = useState(
    () => randomBonusTanukiScene(String(params.chapter || "")) || FALLBACK_SCENE
  );

  useEffect(() => {
    loadGameAudio();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressWithEnergy().then((nextProgress) => {
        setProgress(nextProgress);
        setAttemptsLeft(scene.attempts || 3);
      });
    }, [scene.attempts])
  );

  const hasTicket = (progress.bonusTanukiTickets || 0) > 0;

  const targetStyle = useMemo(() => {
    const diameter = scene.target.radius * 2 * layout.width;

    return {
      left: scene.target.x * layout.width - diameter / 2,
      top: scene.target.y * layout.height - diameter / 2,
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
    };
  }, [layout.height, layout.width, scene.target.radius, scene.target.x, scene.target.y]);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    setLayout({
      width,
      height,
    });
  }

  async function handleTap(event: any) {
    if (found || !hasTicket || attemptsLeft <= 0) return;

    const x = event.nativeEvent.locationX / layout.width;
    const y = event.nativeEvent.locationY / layout.height;
    const dx = x - scene.target.x;
    const dy = y - scene.target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= scene.target.radius) {
      const result = await claimBonusTanukiReward(scene.reward);
      setProgress(result.progress);

      if (!result.success) {
        Alert.alert("Bonus Tanuki", result.message);
        return;
      }

      playSfx("reward");
      setFound(true);

      setRewardText(
        `+${result.reward.xp} XP · +${result.reward.coins} coins${
          result.reward.energy ? ` · +${result.reward.energy} energy` : ""
        }${result.reward.lootBoxes ? " · +1 crate" : ""}${
          result.reward.avatarUnlocked ? " · rare avatar!" : ""
        }`
      );
      return;
    }

    playSfx("wrong");
    const nextAttempts = attemptsLeft - 1;
    setAttemptsLeft(nextAttempts);

    if (nextAttempts <= 0) {
      setRewardText("Tanuki got away this time. Your ticket was not used.");
    }
  }

  function continueNext() {
    router.replace(continueRoute(String(params.next || ""), String(params.chapter || "")) as any);
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={scene.backgroundSource}
        style={styles.background}
        resizeMode="cover"
      >
        <Pressable style={styles.tapLayer} onPress={handleTap} onLayout={onLayout}>
          {found && (
            <View pointerEvents="none" style={[styles.targetReveal, targetStyle]}>
              <Text style={styles.targetTanuki}>🦝</Text>
            </View>
          )}

          <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
            <View style={styles.topCard}>
              <Text style={styles.kicker}>Bonus Game</Text>
              <Text style={styles.title}>Find the Tanuki</Text>
              <Text style={styles.status}>
                🎟 {progress.bonusTanukiTickets || 0} · Attempts {attemptsLeft}
              </Text>
            </View>

            <View style={styles.spacer} />

            <View style={styles.bottomCard}>
              {!hasTicket ? (
                <>
                  <Text style={styles.bottomTitle}>No bonus ticket</Text>
                  <Text style={styles.bottomText}>
                    Restore a room milestone to earn a Bonus Tanuki ticket.
                  </Text>
                </>
              ) : found ? (
                <>
                  <Text style={styles.bottomTitle}>🦝 Tanuki Found!</Text>
                  <Text style={styles.bottomText}>{rewardText}</Text>
                </>
              ) : attemptsLeft <= 0 ? (
                <>
                  <Text style={styles.bottomTitle}>So close!</Text>
                  <Text style={styles.bottomText}>{rewardText}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bottomTitle}>{scene.title}</Text>
                  <Text style={styles.bottomText}>
                    Tap where Tanuki is hiding. Find him before your attempts run out.
                  </Text>
                </>
              )}

              {(found || attemptsLeft <= 0 || !hasTicket) && (
                <Pressable style={styles.primaryButton} onPress={continueNext}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </Pressable>
              )}

              {!found && attemptsLeft > 0 && hasTicket && (
                <Pressable style={styles.secondaryButton} onPress={continueNext}>
                  <Text style={styles.secondaryButtonText}>Skip Bonus</Text>
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </Pressable>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  background: {
    flex: 1,
  },

  tapLayer: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 16,
  },

  topCard: {
    marginTop: 8,
    alignSelf: "center",
    minWidth: 250,
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,247,236,0.93)",
    alignItems: "center",
  },

  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    marginTop: 2,
    fontSize: 23,
    fontWeight: "900",
    color: "#4B2E20",
  },

  status: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
    color: "#7B5A43",
  },

  spacer: {
    flex: 1,
  },

  targetReveal: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 3,
    borderColor: "#FF5C8A",
  },

  targetTanuki: {
    fontSize: 44,
  },

  bottomCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "rgba(255,247,236,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },

  bottomTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  bottomText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#7C2D12",
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 14,
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
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 15,
    fontWeight: "900",
  },
});
