import {
  overlayImageSource,
  restorationBackgroundSource,
  RestorationBundle,
  unlockedRestorationState,
} from "@/lib/restoration-runtime";
import { ChapterSummary } from "@/lib/chapters";
import { tanukiImageForRestorationMood } from "@/lib/tanuki-character";
import { PlayerProgress } from "@/lib/player-progress";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";

type Props = {
  bundle: RestorationBundle;
  chapter: ChapterSummary;
  progress: PlayerProgress;
  completedOverride?: number;
};

function splitDialogueIntoPages(mainText: string, nextText?: string) {
  const pages: string[] = [];

  function addSentences(text?: string) {
    if (!text) return;

    const sentences = text
      .replace(/\s+/g, " ")
      .trim()
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g);

    for (const sentence of sentences || []) {
      const clean = sentence.trim();
      if (clean) pages.push(clean);
    }
  }

  addSentences(mainText);
  addSentences(nextText);

  return pages.length ? pages : [mainText];
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
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

  const canvas = bundle.manifest.mobile_canvas || {
    width: 900,
    height: 1600,
  };
  const aspectRatio = canvas.width / canvas.height;
  const [dialoguePageIndex, setDialoguePageIndex] = useState(0);
  const dialoguePages = useMemo(
    () => splitDialogueIntoPages(state.tanukiText, state.nextText),
    [state.nextText, state.tanukiText]
  );
  const currentDialoguePage =
    dialoguePages[Math.min(dialoguePageIndex, dialoguePages.length - 1)] || "";
  const hasMoreDialogue = dialoguePageIndex < dialoguePages.length - 1;
  const tanukiAnchor = bundle.manifest.tanuki?.anchor || {
    x: 0.16,
    y: 0.72,
    width: 0.22,
  };
  const tanukiWidth = Math.min(0.28, Math.max(0.16, tanukiAnchor.width || 0.22));
  const tanukiLeft = Math.max(0.02, Math.min(0.74, tanukiAnchor.x - tanukiWidth / 2));
  const tanukiTop = Math.max(0.12, Math.min(0.72, tanukiAnchor.y - tanukiWidth));
  const bubbleOnRight = tanukiAnchor.x < 0.5;

  useEffect(() => {
    setDialoguePageIndex(0);
  }, [state.tanukiText, state.nextText]);

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

        <View
          pointerEvents="none"
          style={[
            styles.sceneTanukiWrap,
            {
              left: percent(tanukiLeft),
              top: percent(tanukiTop),
              width: percent(tanukiWidth),
            },
          ]}
        >
          <Image
            source={tanukiImageForRestorationMood(state.tanukiMood)}
            style={styles.sceneTanuki}
            resizeMode="contain"
          />
        </View>

        <View
          style={[
            styles.sceneSpeechBubble,
            bubbleOnRight
              ? {
                  left: percent(Math.min(0.92, tanukiLeft + tanukiWidth + 0.02)),
                  right: 12,
                  top: percent(Math.max(0.08, tanukiTop + 0.02)),
                }
              : {
                  right: percent(Math.min(0.92, 1 - tanukiLeft + 0.02)),
                  left: 12,
                  top: percent(Math.max(0.08, tanukiTop + 0.02)),
                },
          ]}
        >
          <Text style={styles.dialogueTitle}>
            {state.latestMilestone?.title || chapter.title}
          </Text>
          <Text style={styles.dialogueText}>{currentDialoguePage}</Text>
          {dialoguePages.length > 1 && (
            <Text
              style={styles.nextText}
              onPress={() =>
                setDialoguePageIndex((page) => (hasMoreDialogue ? page + 1 : 0))
              }
            >
              {hasMoreDialogue ? "Next ›" : "Replay"}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.dialogueCard}>
        <Text style={styles.compactDialogueText}>
          Pon appears inside the restoration scene so the repair art stays visible.
        </Text>
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

  sceneTanukiWrap: {
    position: "absolute",
    zIndex: 30,
  },

  sceneTanuki: {
    width: "100%",
    aspectRatio: 1,
  },

  sceneSpeechBubble: {
    position: "absolute",
    zIndex: 31,
    maxWidth: 250,
    minHeight: 82,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,247,236,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  dialogueCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(254,243,199,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },

  compactDialogueText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#92400E",
    textAlign: "center",
  },

  dialogueTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400E",
  },

  dialogueText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#7C2D12",
  },

  nextText: {
    alignSelf: "flex-end",
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#FF5C8A",
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
