export const PON_NAME = "Pon";

export const ONBOARDING_STEPS = [
  {
    mood: "guide" as const,
    title: "Pon",
    text: "Hello! I'm Pon. This town used to be full of cozy cafes, gardens, and little shops.",
  },
  {
    mood: "thinking" as const,
    title: "Pon",
    text: "But over time, everything became forgotten. I need your sharp eyes to help restore it.",
  },
  {
    mood: "guide" as const,
    title: "How to Play",
    text: "Each puzzle hides one small anomaly. Find it to earn progress. Every 20 puzzles, we'll restore part of a location.",
  },
  {
    mood: "happy" as const,
    title: "Let's Begin!",
    text: "Little by little, we'll bring the whole town back to life. Our first stop is the Matcha Cafe!",
  },
];

export const CHAPTER_LIBRARY = [
  { id: "matcha_cafe", title: "Matcha Cafe", emoji: "🍵", theme: "Traditional tea cafe", repairs: ["Clean Room", "Tea Set", "Zabuton", "Alcove Display", "Grand Opening"] },
  { id: "retro_kissaten", title: "Retro Kissaten", emoji: "☕", theme: "Showa-era coffee shop", repairs: ["Clean Room", "Coffee Machine", "Record Player", "Dessert Showcase", "Neon Sign"] },
  { id: "ramen_shop", title: "Ramen Shop", emoji: "🍜", theme: "Neighborhood ramen counter", repairs: ["Clean Room", "Counter", "Noren Curtains", "Lanterns", "Signature Bowl"] },
  { id: "onsen_ryokan", title: "Onsen Ryokan", emoji: "♨️", theme: "Cozy hot spring inn", repairs: ["Clean Room", "Futon Set", "Tea Table", "Lantern Lighting", "Scenic Window"] },
  { id: "festival_street", title: "Festival Street", emoji: "🎆", theme: "Summer matsuri street", repairs: ["Clean Street", "Lantern Row", "Takoyaki Stall", "Festival Stage", "Main Gate"] },
  { id: "shrine_grounds", title: "Shrine Grounds", emoji: "⛩️", theme: "Quiet shrine path", repairs: ["Clean Grounds", "Torii Gate", "Stone Lanterns", "Purification Fountain", "Main Shrine"] },
  { id: "manga_shop", title: "Manga Shop", emoji: "🎮", theme: "Manga and retro game shop", repairs: ["Clean Store", "Manga Shelf", "Arcade Machine", "Figure Display", "Neon Sign"] },
  { id: "cat_cafe", title: "Cat Cafe", emoji: "🐱", theme: "Cozy room for cats", repairs: ["Clean Room", "Cat Tower", "Window Lounge", "Dessert Counter", "Main Cat Tree"] },
  { id: "japanese_garden", title: "Japanese Garden", emoji: "🌸", theme: "Peaceful garden path", repairs: ["Clean Garden", "Stone Path", "Koi Pond", "Bridge", "Tea Pavilion"] },
  { id: "tanuki_village", title: "Tanuki Village", emoji: "🦝", theme: "Final restored town square", repairs: ["Marketplace", "Tea House", "Bakery", "Festival Plaza", "Giant Tanuki Statue"] },
];

export function chapterPreviewLine(title: string) {
  return `${title} is waiting for us. Let's restore it together, one puzzle at a time.`;
}
