import { restorationBundleByChapterId } from "@/data/generatedRestorations";
import { ChapterSummary } from "@/lib/chapters";
import { PlayerProgress } from "@/lib/player-progress";
import {
  overlayImageSource,
  restorationBackgroundSource,
  unlockedRestorationState,
} from "@/lib/restoration-runtime";
import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  chapter: ChapterSummary;
  progress: PlayerProgress;
  completedOverride?: number;
  forceClean?: boolean;
  children?: React.ReactNode;
};

export function FullRestorationBackdrop({
  chapter,
  progress,
  completedOverride,
  forceClean,
  children,
}: Props) {
  const bundle = restorationBundleByChapterId(chapter.id);

  if (!bundle) {
    return <View style={styles.fallback}>{children}</View>;
  }

  const renderChapter =
    typeof completedOverride === "number"
      ? {
          ...chapter,
          completed: Math.max(0, completedOverride),
        }
      : chapter;

  const state = unlockedRestorationState(bundle, renderChapter, progress);
  const background =
    forceClean && bundle.sources.cleanBackground
      ? bundle.sources.cleanBackground
      : restorationBackgroundSource(bundle, state);

  const canvas = bundle.manifest.mobile_canvas || {
    width: 900,
    height: 1600,
  };
  const aspectRatio = canvas.width / canvas.height;

  if (!background) {
    return <View style={styles.fallback}>{children}</View>;
  }

  return (
    <ImageBackground
      source={background as ImageSourcePropType}
      style={styles.background}
      resizeMode="cover"
    >
      <View pointerEvents="none" style={[styles.sceneLayer, { aspectRatio }]}>
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
            >
              <Image
                source={source}
                style={{ width: "100%", aspectRatio: 1 / sourceRatio }}
                resizeMode="contain"
              />
            </View>
          );
        })}
      </View>

      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  fallback: {
    flex: 1,
    backgroundColor: "#120B07",
  },

  sceneLayer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  overlay: {
    position: "absolute",
  },
});
