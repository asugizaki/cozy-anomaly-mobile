import { ImageSourcePropType } from "react-native";

export type TanukiMood = "guide" | "thinking" | "happy";
export type RestorationTanukiMood =
  | "idle"
  | "happy"
  | "excited"
  | "thinking"
  | "celebration"
  | "hint";

export const TANUKI_NAME = "Pon";

export function tanukiImageForMood(mood: TanukiMood): ImageSourcePropType {
  if (mood === "thinking") {
    return require("../../assets/characters/tanuki_thinking.png");
  }

  if (mood === "happy") {
    return require("../../assets/characters/tanuki_happy.png");
  }

  return require("../../assets/characters/tanuki_guide.png");
}


export function tanukiImageForRestorationMood(
  mood?: RestorationTanukiMood | string
): ImageSourcePropType {
  if (mood === "thinking" || mood === "hint") {
    return tanukiImageForMood("thinking");
  }

  if (mood === "happy" || mood === "excited" || mood === "celebration") {
    return tanukiImageForMood("happy");
  }

  return tanukiImageForMood("guide");
}

export const TOWN_CHAPTERS = [
  { id: "matcha_cafe", title: "Matcha Cafe", emoji: "🍵" },
  { id: "retro_kissaten", title: "Retro Kissaten", emoji: "☕" },
  { id: "ramen_shop", title: "Ramen Shop", emoji: "🍜" },
  { id: "onsen_ryokan", title: "Onsen Ryokan", emoji: "♨️" },
  { id: "festival_street", title: "Festival Street", emoji: "🎆" },
  { id: "shrine_grounds", title: "Shrine Grounds", emoji: "⛩️" },
  { id: "manga_game_shop", title: "Manga & Game Shop", emoji: "🎮" },
  { id: "cat_cafe", title: "Cat Cafe", emoji: "🐱" },
  { id: "japanese_garden", title: "Japanese Garden", emoji: "🌸" },
  { id: "tanuki_village", title: "Tanuki Village", emoji: "🦝" },
];

export const CHAPTER_RESTORATION_INTERVAL = 20;
export const DEFAULT_CHAPTER_TARGET_PUZZLES = 100;
