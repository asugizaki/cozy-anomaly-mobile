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
  version?: number;
  asset_schema?: "centralized_v1" | string;

  scene: string;
  profile: string;
  difficulty: "easy" | "medium" | "hard";

  background: string;
  background_ref?: string;

  asset: string;
  item_size?: number;
  object_size?: number;

  normal_item: string;
  normal_item_ref?: string;
  normal_item_meta?: string;
  normal_item_meta_ref?: string;

  anomaly: string;
  anomaly_item: string;
  anomaly_item_ref?: string;
  anomaly_item_meta?: string;
  anomaly_item_meta_ref?: string;

  target_slot_index: number;
  slots: PuzzleSlot[];

  rendering: {
    anchor: "bottom_center";
    foot_overlap: number;
    source_width?: number;
    source_height?: number;
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
  collection?: string;
  tags?: string[];
  game_type?: "find_anomaly" | "find_tanuki" | "find_hidden_object";
  difficulty_rating?: number;
  hint_type?: string;
  hint_target?: string;
  import_pack?: string;
  exported_at?: string;
};
