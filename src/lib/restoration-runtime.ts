import { ImageSourcePropType } from "react-native";
import { ChapterSummary } from "./chapters";
import { PlayerProgress } from "./player-progress";

export type RestorationAnimation =
  | "fade_in"
  | "pop_fade"
  | "sparkle_reveal"
  | "slide_up"
  | "tanuki_fix"
  | "clean_sparkle"
  | "chapter_complete";

export type RestorationOverlay = {
  id: string;
  label?: string;
  image: string;
  source_width?: number;
  source_height?: number;
  unlock_at: number;
  x: number;
  y: number;
  width: number;
  z?: number;
  anchor?: "center" | "bottom_center" | "top_center";
  animation?: RestorationAnimation;
  visible_in_editor?: boolean;
};

export type RestorationMilestone = {
  id: string;
  unlock_at: number;
  type: "background_swap" | "overlay" | "overlay_group" | "chapter_complete";
  title: string;
  overlay_id?: string;
  overlay_ids?: string[];
  tanuki_mood?: TanukiMood;
  tanuki_text?: string;
  next_text?: string;
  animation?: RestorationAnimation;
  sound?: string;
};

export type TanukiMood =
  | "idle"
  | "happy"
  | "excited"
  | "thinking"
  | "celebration"
  | "hint";

export type RestorationManifest = {
  schema_version: number;
  chapter_id: string;
  title: string;
  theme?: string;
  mobile_canvas: {
    width: number;
    height: number;
  };
  dirty_background?: string | null;
  clean_background?: string | null;
  tanuki?: {
    default_mood?: TanukiMood;
    anchor?: {
      x: number;
      y: number;
      width: number;
    };
  };
  milestones: RestorationMilestone[];
  overlays: RestorationOverlay[];
};

export type RestorationBundle = {
  manifest: RestorationManifest;
  sources: {
    dirtyBackground?: ImageSourcePropType;
    cleanBackground?: ImageSourcePropType;
    overlays: Record<string, ImageSourcePropType>;
  };
};

export type UnlockedRestorationState = {
  useCleanBackground: boolean;
  unlockedOverlays: RestorationOverlay[];
  latestMilestone?: RestorationMilestone;
  nextMilestone?: RestorationMilestone;
  tanukiMood: TanukiMood;
  tanukiText: string;
  nextText?: string;
  completed: number;
};

export function unlockedRestorationState(
  bundle: RestorationBundle,
  chapter: ChapterSummary,
  _progress: PlayerProgress
): UnlockedRestorationState {
  const completed = chapter.completed;
  const milestones = [...(bundle.manifest.milestones || [])].sort(
    (a, b) => a.unlock_at - b.unlock_at
  );
  const unlockedMilestones = milestones.filter(
    (milestone) => completed >= milestone.unlock_at
  );
  const latestMilestone =
    unlockedMilestones[unlockedMilestones.length - 1];
  const nextMilestone = milestones.find(
    (milestone) => completed < milestone.unlock_at
  );

  const useCleanBackground = unlockedMilestones.some(
    (milestone) => milestone.type === "background_swap"
  );

  const unlockedOverlayIds = new Set<string>();

  for (const milestone of unlockedMilestones) {
    if (milestone.overlay_id) {
      unlockedOverlayIds.add(milestone.overlay_id);
    }

    for (const overlayId of milestone.overlay_ids || []) {
      unlockedOverlayIds.add(overlayId);
    }
  }

  // Also support overlays that unlock directly by count, even if they are not
  // referenced by a milestone yet.
  const unlockedOverlays = (bundle.manifest.overlays || [])
    .filter(
      (overlay) =>
        completed >= overlay.unlock_at || unlockedOverlayIds.has(overlay.id)
    )
    .sort((a, b) => (a.z || 0) - (b.z || 0));

  const defaultMood = bundle.manifest.tanuki?.default_mood || "happy";

  return {
    useCleanBackground,
    unlockedOverlays,
    latestMilestone,
    nextMilestone,
    tanukiMood: latestMilestone?.tanuki_mood || defaultMood,
    tanukiText:
      latestMilestone?.tanuki_text ||
      "Let's restore this cozy place together!",
    nextText:
      latestMilestone?.next_text ||
      (nextMilestone
        ? `${Math.max(0, nextMilestone.unlock_at - completed)} more puzzles until ${nextMilestone.title}.`
        : undefined),
    completed,
  };
}

export function restorationBackgroundSource(
  bundle: RestorationBundle,
  state: UnlockedRestorationState
) {
  if (state.useCleanBackground && bundle.sources.cleanBackground) {
    return bundle.sources.cleanBackground;
  }

  return bundle.sources.dirtyBackground || bundle.sources.cleanBackground;
}

export function overlayImageSource(
  bundle: RestorationBundle,
  overlay: RestorationOverlay
) {
  return bundle.sources.overlays[overlay.id];
}
