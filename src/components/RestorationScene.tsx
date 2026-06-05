import {
  overlayImageSource,
  restorationBackgroundSource,
  RestorationBundle,
  unlockedRestorationState,
} from "@/lib/restoration-runtime";
import { ChapterSummary } from "@/lib/chapters";
import { PlayerProgress } from "@/lib/player-progress";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

type Props = {
  bundle: RestorationBundle;
  chapter: ChapterSummary;
  progress: PlayerProgress;
  completedOverride?: number;
};

function TanukiMoodBadge({ mood }: { mood: string }) {
  const emoji =
    mood === "excited"
      ? "🤩"
      : mood === "thinking"
        ? "🤔"
        : mood === "celebration"
          ? "🎉"
          : mood === "hint"
            ? "💡"
            : "😊";

  return <Text style={styles.tanukiEmoji}>🦝{emoji}</Text>;
}

function AnimatedOverlay({
  source,
  children,
}: {
  source: ImageSourcePropType;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 90,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function RestorationScene({
  bundle,
  chapter,
  progress,
  completedOverride,
}: Props) {
  const renderChapter =
    typeof completedOverride === "number"
      ? {
          ...chapter,
          completed: Math.max(0, completedOverride),
        }
      : chapter;

  const state = unlockedRestorationState(bundle, renderChapter, progress);
  const background = restorationBackgroundSource(bundle, state);

  if (!background) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No restoration art imported yet</Text>
        <Text style={styles.emptyText}>
          Export a restoration bundle from the generator and run import:restoration.
        </Text>
      </View>
    );
  }

  const canvas = bundle.manifest.mobile_canvas || {
    width: 900,
    height: 1600,
  };
  const aspectRatio = canvas.width / canvas.height;

  return (
    <View style={styles.wrap}>
      <View style={[styles.sceneFrame, { aspectRatio }]}>
        <Image
          source={background}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />

        {state.unlockedOverlays.map((overlay) => {
          const source = overlayImageSource(bundle, overlay);

          if (!source) return null;

          const sourceRatio =
            (overlay.source_height || 1) / (overlay.source_width || 1);
          const widthPercent = overlay.width * 100;
          const heightPercent = overlay.width * sourceRatio * aspectRatio * 100;

          let leftPercent = overlay.x * 100 - widthPercent / 2;
          let topPercent = overlay.y * 100 - heightPercent / 2;

          if (overlay.anchor === "bottom_center") {
            topPercent = overlay.y * 100 - heightPercent;
          } else if (overlay.anchor === "top_center") {
            topPercent = overlay.y * 100;
          }

          return (
            <View
              key={overlay.id}
              style={[
                styles.overlay,
                {
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  zIndex: 10 + (overlay.z || 0),
                },
              ]}
              pointerEvents="none"
            >
              <AnimatedOverlay source={source}>
                <Image
                  source={source}
                  style={{ width: "100%", aspectRatio: 1 / sourceRatio }}
                  resizeMode="contain"
                />
              </AnimatedOverlay>
            </View>
          );
        })}
      </View>

      <View style={styles.dialogueCard}>
        <TanukiMoodBadge mood={state.tanukiMood} />

        <View style={styles.dialogueTextWrap}>
          <Text style={styles.dialogueTitle}>
            {state.latestMilestone?.title || chapter.title}
          </Text>
          <Text style={styles.dialogueText}>{state.tanukiText}</Text>

          {!!state.nextText && (
            <Text style={styles.nextText}>{state.nextText}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },

  sceneFrame: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },

  overlay: {
    position: "absolute",
  },

  dialogueCard: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },

  tanukiEmoji: {
    fontSize: 34,
  },

  dialogueTextWrap: {
    flex: 1,
  },

  dialogueTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400E",
  },

  dialogueText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#7C2D12",
  },

  nextText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#A16207",
  },

  emptyCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.94)",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4B2E20",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#7B5A43",
  },
});
