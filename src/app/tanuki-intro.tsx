import { TanukiDialog } from "@/components/TanukiDialog";
import { TOWN_CHAPTERS } from "@/lib/tanuki-character";
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from "@/lib/player-progress";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INTRO_STEPS = [
  {
    title: "A forgotten town",
    mood: "guide" as const,
    text:
      "Long ago, this town was famous for cozy cafes, gardens, festivals, and little shops.",
    subtext: "But over time, everything was forgotten.",
  },
  {
    title: "Pon needs your help",
    mood: "thinking" as const,
    text:
      "I'm Pon. I want to bring this town back, but I need someone with sharp eyes.",
    subtext: "Will you help me restore each place?",
  },
  {
    title: "How to play",
    mood: "guide" as const,
    text:
      "Each puzzle hides a small anomaly. Find it to earn restoration progress.",
    subtext:
      "Every 20 puzzles, we'll restore part of a location. Each chapter has 100 puzzles.",
  },
  {
    title: "Our journey",
    mood: "happy" as const,
    text:
      "Together, we'll travel through different chapters and bring the whole town back to life.",
    subtext: "Let's start with the Matcha Cafe.",
  },
];

export default function TanukiIntroScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const step = INTRO_STEPS[stepIndex];

  useEffect(() => {
    loadProgress().then((progress) => {
      if (progress.hasSeenTownIntro) {
        router.replace("/");
      }
    });
  }, []);

  async function finishIntro() {
    if (saving) return;

    setSaving(true);

    const progress = await loadProgress();

    await saveProgress({
      ...DEFAULT_PROGRESS,
      ...progress,
      hasSeenTownIntro: true,
    });

    router.replace("/chapter-intro?chapter=matcha_cafe");
  }

  function next() {
    if (stepIndex < INTRO_STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    finishIntro();
  }

  return (
    <ImageBackground
      source={require("../../assets/home-bg.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.logo}>Hidden Tanuki</Text>
          <Text style={styles.subtitle}>Restore a cozy Japanese town.</Text>
        </View>

        <View style={styles.characterWrap}>
          <Image
            source={
              step.mood === "happy"
                ? require("../../assets/characters/tanuki_happy.png")
                : step.mood === "thinking"
                  ? require("../../assets/characters/tanuki_thinking.png")
                  : require("../../assets/characters/tanuki_guide.png")
            }
            resizeMode="contain"
            style={styles.heroTanuki}
          />
        </View>

        <View style={styles.panel}>
          <Text style={styles.kicker}>Chapter Journey</Text>
          <Text style={styles.title}>{step.title}</Text>

          <TanukiDialog
            mood={step.mood}
            text={step.text}
            subtext={step.subtext}
            restartKey={stepIndex}
            compact
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chapterStrip}
          >
            {TOWN_CHAPTERS.map((chapter, index) => (
              <View
                key={chapter.id}
                style={[
                  styles.chapterPill,
                  index === 0 && styles.chapterPillActive,
                ]}
              >
                <Text style={styles.chapterEmoji}>{chapter.emoji}</Text>
                <Text style={styles.chapterText}>{chapter.title}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.dots}>
            {INTRO_STEPS.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={next}>
            <Text style={styles.primaryButtonText}>
              {stepIndex === INTRO_STEPS.length - 1
                ? saving
                  ? "Starting..."
                  : "Start the Matcha Cafe"
                : "Continue"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={finishIntro}>
            <Text style={styles.secondaryButtonText}>Skip Intro</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.26)",
  },

  header: {
    alignItems: "center",
    paddingTop: 26,
  },

  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },

  subtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontWeight: "800",
  },

  characterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  heroTanuki: {
    width: 250,
    height: 280,
  },

  panel: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 30,
    backgroundColor: "rgba(255,247,236,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },

  kicker: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#FF5C8A",
  },

  title: {
    marginTop: 3,
    fontSize: 27,
    fontWeight: "900",
    color: "#4B2E20",
  },

  chapterStrip: {
    gap: 8,
    paddingVertical: 12,
  },

  chapterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
  },

  chapterPillActive: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },

  chapterEmoji: {
    fontSize: 15,
  },

  chapterText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6A3F2B",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E7BFA7",
  },

  dotActive: {
    width: 22,
    backgroundColor: "#FF5C8A",
  },

  primaryButton: {
    paddingVertical: 15,
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
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 14,
    fontWeight: "900",
  },
});
