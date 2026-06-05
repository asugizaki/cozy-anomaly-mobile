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
    return chapterTagged;
  }

  const ids = new Set(chapter.collectionIds);
  const pool = PUZZLES.filter((puzzle) => ids.has(puzzleCollectionId(puzzle)));

  if (pool.length) return pool;

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
  const available = puzzleIds.length;
  const total = chapter.targetPuzzleCount || available;
  const cappedCompleted = Math.min(completed, total);
  const progressPercent = total ? Math.min(100, Math.round((cappedCompleted / total) * 100)) : 0;
  const completedRepairs = chapter.repairs.filter(
    (repair) => cappedCompleted >= repair.completedAt
  ).length;
  const nextRepair = chapter.repairs.find((repair) => cappedCompleted < repair.completedAt);

  return {
    ...chapter,
    puzzles,
    puzzleIds,
    completed: cappedCompleted,
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
    fullyRestored: cappedCompleted >= total,
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

function difficultyForChapterStep(completedInChapter: number) {
  const stepInMilestone = completedInChapter % 20;

  if (stepInMilestone < 7) return "easy";
  if (stepInMilestone < 14) return "medium";

  return "hard";
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function puzzleSpreadScore(
  puzzle: ComposablePuzzle,
  progress: PlayerProgress
) {
  const recentIds = progress.recentPlayedPuzzleIds || [];
  const recentIndexes = progress.recentPuzzleIndexes || [];

  let score = Math.random();

  if (recentIds.includes(puzzle.id)) {
    score -= 1000;
  }

  const recentPuzzles = recentIds
    .map((id) => PUZZLES.find((item) => item.id === id))
    .filter(Boolean) as ComposablePuzzle[];

  const recentAssets = recentPuzzles
    .slice(0, 8)
    .map((item) => item.asset)
    .filter(Boolean);

  const recentScenes = recentPuzzles
    .slice(0, 8)
    .map((item) => item.scene)
    .filter(Boolean);

  if (puzzle.asset && recentAssets.includes(puzzle.asset)) {
    score -= 18;
  }

  if (puzzle.scene && recentScenes.includes(puzzle.scene)) {
    score -= 6;
  }

  const index = PUZZLES.findIndex((item) => item.id === puzzle.id);

  if (index >= 0 && recentIndexes.includes(index)) {
    score -= 1000;
  }

  return score;
}

export function nextChapterPuzzleIndex(
  chapter: ChapterSummary,
  progress: PlayerProgress
) {
  if (chapter.completed >= chapter.targetPuzzleCount) {
    return -1;
  }

  const completed = normalizedCompleted(progress);
  const unsolved = chapter.puzzles.filter((puzzle) => !completed.has(puzzle.id));

  if (!unsolved.length) {
    return -1;
  }

  const preferredDifficulty = difficultyForChapterStep(chapter.completed);

  const preferred = unsolved.filter(
    (puzzle) => puzzle.difficulty === preferredDifficulty
  );

  const candidates = preferred.length ? preferred : unsolved;

  const picked = shuffled(candidates).sort(
    (a, b) => puzzleSpreadScore(b, progress) - puzzleSpreadScore(a, progress)
  )[0];

  const index = PUZZLES.findIndex((puzzle) => puzzle.id === picked.id);

  return Math.max(0, index);
}

export function chapterDisplayNameForPuzzle(puzzle: ComposablePuzzle) {
  const collectionId = puzzleCollectionId(puzzle);
  const chapter = CHAPTERS.find((item) => item.collectionIds.includes(collectionId));

  if (chapter) return chapter.title;

  return `${collectionEmoji(collectionId)} ${collectionLabel(collectionId)}`;
}
