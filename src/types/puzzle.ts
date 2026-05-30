import { ImageSourcePropType } from "react-native";

export type PuzzleSlot = {
  x: number;
  surface_y: number;
};

export type AnswerBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ComposablePuzzle = {
  id: string;
  version: number;
  scene: string;
  profile: string;
  difficulty: "easy" | "medium" | "hard";
  background: string;
  asset: string;
  item_size: number;
  normal_item: string;
  normal_item_meta: string;
  anomaly: string;
  anomaly_item: string;
  anomaly_item_meta: string;
  target_slot_index: number;
  slots: PuzzleSlot[];
  rendering: {
    anchor: "bottom_center";
    foot_overlap: number;
    item_width: number;
    item_height: number;
  };
  answer: string;
  answer_box: AnswerBox;
  answer_visual_box?: AnswerBox;
  backgroundSource: ImageSourcePropType;
  normalItemSource: ImageSourcePropType;
  anomalyItemSource: ImageSourcePropType;
  category?: string;
  tags?: string[];
  game_type?: "find_anomaly" | "find_tanuki";
  difficulty_rating?: number;
  hint_type?: string;
  hint_target?: string;
};