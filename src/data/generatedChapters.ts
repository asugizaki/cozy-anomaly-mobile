import { ChapterDefinition } from "@/lib/chapters";

export const GENERATED_CHAPTERS: ChapterDefinition[] = [
  {
    "id": "matcha_cafe",
    "title": "Matcha Cafe",
    "subtitle": "Restore a quiet tea cafe with Tanuki",
    "theme": "Matcha",
    "emoji": "🦝",
    "collectionIds": [
      "matcha_cafe"
    ],
    "targetPuzzleCount": 80,
    "warnRemaining": 20,
    "criticalRemaining": 10,
    "intro": "This old Matcha Cafe needs our help! Let's restore it together!",
    "completionText": "The Matcha Cafe is cozy again. Amaizing work!",
    "repairs": [
      {
        "id": "clean_room",
        "title": "Clean the Room",
        "description": "Now that the room is clean, let's add a nice tea ceremony set.",
        "completedAt": 20,
        "beforeEmoji": "⬜",
        "afterEmoji": "✨"
      },
      {
        "id": "tea_set",
        "title": "Add the Tea Set",
        "description": "A few zabuton cushions would make this a cozy place to sit.",
        "completedAt": 40,
        "beforeEmoji": "⬜",
        "afterEmoji": "✨"
      },
      {
        "id": "zabuton",
        "title": "Add the Zabuton",
        "description": "The alcove still feels empty. Let's add a beautiful matcha display.",
        "completedAt": 60,
        "beforeEmoji": "⬜",
        "afterEmoji": "✨"
      },
      {
        "id": "matcha_display",
        "title": "Decorate the Alcove",
        "description": "One final masterpiece will make this chapter unforgettable.",
        "completedAt": 80,
        "beforeEmoji": "⬜",
        "afterEmoji": "✨"
      }
    ]
  }
];
