import {
  BONUS_TANUKI_SCENES,
  randomBonusTanukiScene,
  BonusTanukiScene,
} from "@/data/generatedBonusTanukiScenes";
import { RewardMultiplierCard } from "@/components/RewardMultiplierCard";
import { claimBonusTanukiReward, BonusTanukiReward } from "@/lib/bonus-tanuki";
import { loadGameAudio, playSfx } from "@/lib/audio";
import { loadProgressWithEnergy } from "@/lib/energy";
import { DEFAULT_PROGRESS, PlayerProgress } from "@/lib/player-progress";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  target: { x: 0.5, y: 0.55, radius: 0.12 },
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

  if (next === "dev-tools") {
    return "/dev-tools";
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
    scene?: string;
  }>();

  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [found, setFound] = useState(false);
  const [rewardText, setRewardText] = useState("");
  const [claimedReward, setClaimedReward] = useState<BonusTanukiReward | null>(null);
  const [scene] = useState(() => {
    const requestedSceneId = String(params.scene || "");
    const requestedScene = requestedSceneId
      ? BONUS_TANUKI_SCENES.find((item) => item.id === requestedSceneId)
      : undefined;

    return (
      requestedScene ||
      randomBonusTanukiScene(String(params.chapter || "")) ||
      FALLBACK_SCENE
    );
  });

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

  function coverMetrics() {
    const imageWidth = scene.canvas?.width || 900;
    const imageHeight = scene.canvas?.height || 1600;
    const scale = Math.max(layout.width / imageWidth, layout.height / imageHeight);
    const renderedWidth = imageWidth * scale;
    const renderedHeight = imageHeight * scale;

    return {
      renderedWidth,
      renderedHeight,
      offsetX: (layout.width - renderedWidth) / 2,
      offsetY: (layout.height - renderedHeight) / 2,
    };
  }

  function screenToImageNormalized(x: number, y: number) {
    const metrics = coverMetrics();

    return {
      x: (x - metrics.offsetX) / metrics.renderedWidth,
      y: (y - metrics.offsetY) / metrics.renderedHeight,
    };
  }

  const targetStyle = useMemo(() => {
    const metrics = coverMetrics();
    const diameter = Math.max(scene.target.radius, 0.11) * 2 * metrics.renderedWidth;

    return {
      left: metrics.offsetX + scene.target.x * metrics.renderedWidth - diameter / 2,
      top: metrics.offsetY + scene.target.y * metrics.renderedHeight - diameter / 2,
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
    };
  }, [layout.height, layout.width, scene.canvas?.height, scene.canvas?.width, scene.target.radius, scene.target.x, scene.target.y]);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    setLayout({
      width,
      height,
    });
  }

  async function handleTap(event: any) {
    if (found || attemptsLeft <= 0) return;

    const point = screenToImageNormalized(
      event.nativeEvent.locationX,
      event.nativeEvent.locationY
    );

    const dx = point.x - scene.target.x;
    const dy = point.y - scene.target.y;
    const imageAspect = (scene.canvas?.height || 1600) / (scene.canvas?.width || 900);
    const normalizedDistance = Math.sqrt(dx * dx + (dy * imageAspect) * (dy * imageAspect));
    const hitRadius = Math.max(scene.target.radius, 0.11);

    if (normalizedDistance <= hitRadius) {
      const result = await claimBonusTanukiReward(scene.reward);
      setProgress(result.progress);
      setClaimedReward(result.reward);

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
      setRewardText("Tanuki got away this time.");
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
            <View pointerEvents="none" style={[styles.targetReveal, targetStyle]} />
          )}

          <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
            <View style={styles.topBar}>
              <Text style={styles.topBarText}>🦝 Find the Tanuki</Text>
              <Text style={styles.topBarSub}>Attempts {attemptsLeft}</Text>
            </View>

            <View style={styles.spacer} />

            <View style={styles.bottomCard}>
              {found ? (
                <>
                  <Text style={styles.bottomTitle}>🦝 Found!</Text>
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
                    Tap where Tanuki is hiding.
                  </Text>
                </>
              )}

              {found && claimedReward && (
                <RewardMultiplierCard
                  source="bonus_tanuki"
                  reward={claimedReward}
                  metadata={{
                    sceneId: scene.id,
                    chapterId: scene.chapter_id || String(params.chapter || ""),
                  }}
                  onClaimed={setProgress}
                />
              )}

              {(found || attemptsLeft <= 0) && (
                <Pressable style={styles.primaryButton} onPress={continueNext}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </Pressable>
              )}

              {!found && attemptsLeft > 0 && (
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
    paddingHorizontal: 12,
  },

  topBar: {
    marginTop: 8,
    alignSelf: "stretch",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,247,236,0.88)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topBarText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4B2E20",
  },

  topBarSub: {
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


  bottomCard: {
    marginBottom: 10,
    padding: 13,
    borderRadius: 23,
    backgroundColor: "rgba(255,247,236,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },

  bottomTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  bottomText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#7C2D12",
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 12,
    paddingVertical: 13,
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
    marginTop: 9,
    paddingVertical: 12,
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
