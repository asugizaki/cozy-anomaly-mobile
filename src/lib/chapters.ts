import { PUZZLES } from "@/data/puzzles";
import { ComposablePuzzle } from "@/types/puzzle";
import { GENERATED_CHAPTERS } from "@/data/generatedChapters";
import { collectionEmoji, collectionLabel, puzzleCollectionId } from "./collections";
import { PlayerProgress } from "./player-progress";

export type ChapterRepair = {
  id: string;
  title: string;
  description: string;
  completedAt: number;
  beforeEmoji: string;
  afterEmoji: string;
};

export type ChapterDefinition = {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  emoji: string;
  collectionIds: string[];
  targetPuzzleCount: number;
  repairs: ChapterRepair[];
  intro: string;
  completionText: string;
};

export type ChapterSummary = ChapterDefinition & {
  puzzleIds: string[];
  puzzles: ComposablePuzzle[];
  completed: number;
  total: number;
  progress: number;
  unlocked: boolean;
  completedRepairs: number;
  nextRepair?: ChapterRepair;
  bonusReady: boolean;
  fullyRestored: boolean;
};

export const FALLBACK_CHAPTERS: ChapterDefinition[] = [
  {
    id: "matcha_cafe",
    title: "Matcha Cafe",
    subtitle: "Restore a quiet tea cafe with Tanuki.",
    theme: "Matcha, tea sweets, tatami, warm wood shelves",
    emoji: "🍵",
    collectionIds: ["matcha_cafe", "cozy_cafe", "cafe", "food", "japanese", "general"],
    targetPuzzleCount: 80,
    intro:
      "The Matcha Cafe is dusty and quiet. Tanuki needs your sharp eyes to bring it back to life.",
    completionText:
      "The Matcha Cafe is cozy again. Tanuki is ready to guide you to the next hidden place.",
    repairs: [
      {
        id: "clean_room",
        title: "Clean the Room",
        description: "Clear the dust and make the cafe feel welcoming again.",
        completedAt: 20,
        beforeEmoji: "🧹",
        afterEmoji: "✨",
      },
      {
        id: "tea_set",
        title: "Add the Tea Set",
        description: "Place a beautiful tea ceremony set on the table.",
        completedAt: 40,
        beforeEmoji: "🍃",
        afterEmoji: "🍵",
      },
      {
        id: "zabuton",
        title: "Add the Zabuton",
        description: "Add traditional floor cushions for cozy seating.",
        completedAt: 60,
        beforeEmoji: "⬜",
        afterEmoji: "🟩",
      },
      {
        id: "matcha_display",
        title: "Decorate the Alcove",
        description: "Complete the room with a handcrafted matcha display.",
        completedAt: 80,
        beforeEmoji: "🪵",
        afterEmoji: "🌿",
      },
    ],
  },
  {
    id: "retro_kissaten",
    title: "Retro Kissaten",
    subtitle: "A nostalgic cafe full of coffee, records, and old signs.",
    theme: "Retro coffee shop, desserts, records, Showa-era details",
    emoji: "☕",
    collectionIds: ["retro_kissaten", "kissaten", "coffee", "dessert"],
    targetPuzzleCount: 80,
    intro:
      "The next stop is a sleepy retro kissaten. The lights flicker, but the memories are still here.",
    completionText:
      "The Retro Kissaten is ready for customers again.",
    repairs: [
      {
        id: "counter",
        title: "Polish the Counter",
        description: "Bring the old wooden counter back to life.",
        completedAt: 20,
        beforeEmoji: "🪵",
        afterEmoji: "✨",
      },
      {
        id: "coffee_machine",
        title: "Fix the Coffee Machine",
        description: "Repair the machine so it can brew again.",
        completedAt: 40,
        beforeEmoji: "⚙️",
        afterEmoji: "☕",
      },
      {
        id: "record_player",
        title: "Repair the Record Player",
        description: "Let the cozy music return.",
        completedAt: 60,
        beforeEmoji: "📻",
        afterEmoji: "🎶",
      },
      {
        id: "neon_sign",
        title: "Light the Sign",
        description: "Turn the old sign back on.",
        completedAt: 80,
        beforeEmoji: "💡",
        afterEmoji: "🌟",
      },
    ],
  },
];

export const CHAPTERS: ChapterDefinition[] =
  GENERATED_CHAPTERS.length > 0 ? GENERATED_CHAPTERS : FALLBACK_CHAPTERS;

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizedCompleted(progress: PlayerProgress) {
  return new Set(progress.completedPuzzleIds || []);
}

export function chapterPuzzlePool(chapter: ChapterDefinition) {
  const chapterTagged = PUZZLES.filter(
    (puzzle) => (puzzle as any).chapter_id === chapter.id
  );

  if (chapterTagged.length) {
    return chapterTagged.slice(0, chapter.targetPuzzleCount);
  }

  const ids = new Set(chapter.collectionIds);
  const pool = PUZZLES.filter((puzzle) => ids.has(puzzleCollectionId(puzzle)));

  if (pool.length) return pool.slice(0, chapter.targetPuzzleCount);

  return [];
}

export function chapterPuzzleIds(chapter: ChapterDefinition) {
  return chapterPuzzlePool(chapter).map((puzzle) => puzzle.id);
}

export function chapterSummary(
  chapter: ChapterDefinition,
  progress: PlayerProgress,
  previousComplete: boolean
): ChapterSummary {
  const puzzles = chapterPuzzlePool(chapter);
  const puzzleIds = unique(puzzles.map((puzzle) => puzzle.id));
  const completed = puzzleIds.filter((id) => normalizedCompleted(progress).has(id)).length;
  const total = Math.max(chapter.targetPuzzleCount, puzzleIds.length || chapter.targetPuzzleCount);
  const progressPercent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const completedRepairs = chapter.repairs.filter(
    (repair) => completed >= repair.completedAt
  ).length;
  const nextRepair = chapter.repairs.find((repair) => completed < repair.completedAt);

  return {
    ...chapter,
    puzzles,
    puzzleIds,
    completed,
    total,
    progress: progressPercent,
    unlocked: chapter.id === CHAPTERS[0].id || previousComplete,
    completedRepairs,
    nextRepair,
    bonusReady:
      completed > 0 &&
      completedRepairs > 0 &&
      completed % 20 === 0 &&
      completed < total,
    fullyRestored: completed >= total,
  };
}

export function chapterSummaries(progress: PlayerProgress) {
  let previousComplete = true;

  return CHAPTERS.map((chapter) => {
    const summary = chapterSummary(chapter, progress, previousComplete);
    previousComplete = summary.fullyRestored;
    return summary;
  });
}

export function currentChapter(progress: PlayerProgress) {
  const summaries = chapterSummaries(progress);

  return (
    summaries.find((chapter) => chapter.unlocked && !chapter.fullyRestored) ||
    summaries[summaries.length - 1]
  );
}

export function chapterById(id?: string) {
  return CHAPTERS.find((chapter) => chapter.id === id) || CHAPTERS[0];
}

export function nextChapterPuzzleIndex(
  chapter: ChapterSummary,
  progress: PlayerProgress
) {
  const completed = normalizedCompleted(progress);
  const next = chapter.puzzles.find((puzzle) => !completed.has(puzzle.id));

  if (next) {
    const index = PUZZLES.findIndex((puzzle) => puzzle.id === next.id);
    return Math.max(0, index);
  }

  return -1;
}

export function chapterDisplayNameForPuzzle(puzzle: ComposablePuzzle) {
  const collectionId = puzzleCollectionId(puzzle);
  const chapter = CHAPTERS.find((item) => item.collectionIds.includes(collectionId));

  if (chapter) return chapter.title;

  return `${collectionEmoji(collectionId)} ${collectionLabel(collectionId)}`;
}
