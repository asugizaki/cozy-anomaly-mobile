import { PUZZLES } from "@/data/puzzles";
import { ComposablePuzzle } from "@/types/puzzle";
import { GENERATED_CHAPTERS } from "@/data/generatedChapters";
import { collectionEmoji, collectionLabel, puzzleCollectionId } from "./collections";
import { PlayerProgress } from "./player-progress";

export const CHAPTER_PUZZLE_TARGET = 100;
export const CHAPTER_REPAIR_MILESTONES = [20, 40, 60, 80, 100];
export const RECENT_HISTORY_LIMIT = 15;

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
  unlockAfterChapterId?: string;
  sortOrder?: number;
  warnRemaining?: number;
  criticalRemaining?: number;
};

export type ChapterSummary = ChapterDefinition & {
  puzzleIds: string[];
  puzzles: ComposablePuzzle[];
  completed: number;
  total: number;
  progress: number;
  unlocked: boolean;
  lockedReason?: string;
  completedRepairs: number;
  nextRepair?: ChapterRepair;
  bonusReady: boolean;
  fullyRestored: boolean;
  stars: number;
  availablePuzzleCount: number;
  remainingPuzzleCount: number;
  contentStatus: "ready" | "warning" | "critical" | "missing";
};

const DEFAULT_REPAIR_TEMPLATES: Array<Omit<ChapterRepair, "completedAt">> = [
  {
    id: "clean_room",
    title: "Clean the Room",
    description: "Clear the dust and make this place feel welcoming again.",
    beforeEmoji: "🧹",
    afterEmoji: "✨",
  },
  {
    id: "restore_centerpiece",
    title: "Add the Centerpiece",
    description: "Add the first beautiful item that brings the room back to life.",
    beforeEmoji: "⬜",
    afterEmoji: "🌟",
  },
  {
    id: "restore_comfort",
    title: "Add Cozy Details",
    description: "Make the space feel comfortable and lived in.",
    beforeEmoji: "⬜",
    afterEmoji: "🧡",
  },
  {
    id: "restore_display",
    title: "Decorate the Display",
    description: "Add decorative details that show this place has a story.",
    beforeEmoji: "⬜",
    afterEmoji: "🎍",
  },
  {
    id: "grand_opening",
    title: "Grand Opening",
    description: "Finish the restoration and reopen this location for Tanuki Town.",
    beforeEmoji: "🚪",
    afterEmoji: "🎉",
  },
];

function fallbackRepairs(prefix = "chapter") {
  return CHAPTER_REPAIR_MILESTONES.map((completedAt, index) => ({
    ...DEFAULT_REPAIR_TEMPLATES[index],
    id:
      DEFAULT_REPAIR_TEMPLATES[index]?.id ||
      `${prefix}_repair_${completedAt}`,
    completedAt,
  }));
}

export const FALLBACK_CHAPTERS: ChapterDefinition[] = [
  {
    id: "matcha_cafe",
    title: "Matcha Cafe",
    subtitle: "Restore a quiet tea cafe with Pon.",
    theme: "Matcha, tea sweets, tatami, warm wood shelves",
    emoji: "🍵",
    collectionIds: ["matcha_cafe", "cozy_cafe", "cafe", "food", "japanese", "general"],
    targetPuzzleCount: CHAPTER_PUZZLE_TARGET,
    intro:
      "This old Matcha Cafe is dusty and quiet. Let's solve puzzles and bring it back one step at a time.",
    completionText:
      "The Matcha Cafe is cozy again. Amazing work! Tanuki Town is already feeling warmer.",
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
      {
        id: "grand_opening",
        title: "Grand Opening",
        description: "Finish the Matcha Cafe and welcome visitors back.",
        completedAt: 100,
        beforeEmoji: "🚪",
        afterEmoji: "🎉",
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
    targetPuzzleCount: CHAPTER_PUZZLE_TARGET,
    unlockAfterChapterId: "matcha_cafe",
    intro:
      "The next stop is a sleepy retro kissaten. The lights flicker, but the memories are still here.",
    completionText:
      "The Retro Kissaten is ready for customers again. I can almost hear the music playing.",
    repairs: [
      {
        id: "clean_room",
        title: "Clean the Shop",
        description: "Sweep away the dust and reveal the old charm.",
        completedAt: 20,
        beforeEmoji: "🧹",
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
        id: "dessert_case",
        title: "Fill the Dessert Case",
        description: "Bring back the sweet treats people remember.",
        completedAt: 80,
        beforeEmoji: "⬜",
        afterEmoji: "🍰",
      },
      {
        id: "neon_sign",
        title: "Light the Sign",
        description: "Turn the old neon sign back on.",
        completedAt: 100,
        beforeEmoji: "💡",
        afterEmoji: "🌟",
      },
    ],
  },
];

function normalizedGeneratedChapters() {
  const source = GENERATED_CHAPTERS.length > 0 ? GENERATED_CHAPTERS : FALLBACK_CHAPTERS;

  return source
    .map(normalizeChapterDefinition)
    .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
}

function normalizeChapterDefinition(
  chapter: ChapterDefinition,
  index = 0
): ChapterDefinition {
  const targetPuzzleCount = chapter.targetPuzzleCount || CHAPTER_PUZZLE_TARGET;
  const normalizedTarget =
    targetPuzzleCount < CHAPTER_PUZZLE_TARGET ? CHAPTER_PUZZLE_TARGET : targetPuzzleCount;

  const repairsByMilestone = new Map<number, ChapterRepair>();

  (chapter.repairs || []).forEach((repair) => {
    const nearestMilestone =
      CHAPTER_REPAIR_MILESTONES.find(
        (milestone) => Math.abs(milestone - repair.completedAt) <= 2
      ) || repair.completedAt;

    repairsByMilestone.set(nearestMilestone, {
      ...repair,
      completedAt: nearestMilestone,
    });
  });

  const repairs = CHAPTER_REPAIR_MILESTONES.map((completedAt, repairIndex) => {
    const existing = repairsByMilestone.get(completedAt);

    if (existing) {
      return {
        ...existing,
        completedAt,
      };
    }

    return {
      ...DEFAULT_REPAIR_TEMPLATES[repairIndex],
      id:
        repairIndex === 0
          ? "clean_room"
          : repairIndex === CHAPTER_REPAIR_MILESTONES.length - 1
            ? "grand_opening"
            : `${chapter.id}_repair_${completedAt}`,
      completedAt,
    };
  });

  return {
    ...chapter,
    emoji: chapter.emoji || "🦝",
    collectionIds: Array.from(new Set([chapter.id, ...(chapter.collectionIds || [])])),
    targetPuzzleCount: normalizedTarget,
    repairs,
    sortOrder: chapter.sortOrder || index + 1,
    warnRemaining: chapter.warnRemaining ?? 20,
    criticalRemaining: chapter.criticalRemaining ?? 10,
    unlockAfterChapterId:
      chapter.unlockAfterChapterId === "" ? undefined : chapter.unlockAfterChapterId,
  };
}

export const CHAPTERS: ChapterDefinition[] = normalizedGeneratedChapters();

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizedCompleted(progress: PlayerProgress) {
  return new Set(progress.completedPuzzleIds || []);
}

function chapterTagForPuzzle(puzzle: ComposablePuzzle) {
  return (
    (puzzle as any).chapter_id ||
    (puzzle as any).chapterId ||
    (puzzle as any).chapter ||
    ""
  );
}

export function chapterPuzzlePool(chapter: ChapterDefinition) {
  const chapterTagged = PUZZLES.filter((puzzle) => chapterTagForPuzzle(puzzle) === chapter.id);

  if (chapterTagged.length) {
    return chapterTagged;
  }

  const ids = new Set(chapter.collectionIds || []);
  const pool = PUZZLES.filter((puzzle) => ids.has(puzzleCollectionId(puzzle)));

  if (pool.length) return pool;

  return [];
}

export function chapterPuzzleIds(chapter: ChapterDefinition) {
  return chapterPuzzlePool(chapter).map((puzzle) => puzzle.id);
}

function contentStatus(chapter: ChapterDefinition, availablePuzzleCount: number) {
  if (availablePuzzleCount <= 0) return "missing";
  if (availablePuzzleCount <= (chapter.criticalRemaining || 10)) return "critical";
  if (availablePuzzleCount < chapter.targetPuzzleCount) return "warning";

  return "ready";
}

function chapterStars(chapter: ChapterDefinition, completed: number) {
  const ratio = chapter.targetPuzzleCount
    ? completed / chapter.targetPuzzleCount
    : 0;

  if (ratio >= 1) return 3;
  if (ratio >= 0.8) return 2;
  if (ratio >= 0.4) return 1;

  return 0;
}

export function isChapterUnlocked(
  chapter: ChapterDefinition,
  progress: PlayerProgress
) {
  const index = CHAPTERS.findIndex((item) => item.id === chapter.id);

  if (index <= 0) return true;

  if (chapter.unlockAfterChapterId) {
    const required = chapterSummary(
      chapterById(chapter.unlockAfterChapterId),
      progress,
      true
    );

    return required.fullyRestored;
  }

  const previous = CHAPTERS[index - 1];
  const previousSummary = chapterSummary(previous, progress, true);

  return previousSummary.fullyRestored;
}

export function chapterSummary(
  chapter: ChapterDefinition,
  progress: PlayerProgress,
  previousComplete = true
): ChapterSummary {
  const puzzles = chapterPuzzlePool(chapter);
  const puzzleIds = unique(puzzles.map((puzzle) => puzzle.id));
  const completed = puzzleIds.filter((id) => normalizedCompleted(progress).has(id)).length;
  const total = chapter.targetPuzzleCount || CHAPTER_PUZZLE_TARGET;
  const cappedCompleted = Math.min(completed, total);
  const progressPercent = total ? Math.min(100, Math.round((cappedCompleted / total) * 100)) : 0;
  const completedRepairs = chapter.repairs.filter(
    (repair) => cappedCompleted >= repair.completedAt
  ).length;
  const nextRepair = chapter.repairs.find((repair) => cappedCompleted < repair.completedAt);
  const unlocked = previousComplete && isChapterUnlocked(chapter, progress);
  const remainingPuzzleCount = Math.max(0, total - cappedCompleted);

  return {
    ...chapter,
    puzzles,
    puzzleIds,
    completed: cappedCompleted,
    total,
    progress: progressPercent,
    unlocked,
    lockedReason: unlocked ? undefined : "Complete the previous chapter to unlock this one.",
    completedRepairs,
    nextRepair,
    bonusReady:
      cappedCompleted > 0 &&
      completedRepairs > 0 &&
      cappedCompleted % 20 === 0 &&
      cappedCompleted < total,
    fullyRestored: cappedCompleted >= total,
    stars: chapterStars(chapter, cappedCompleted),
    availablePuzzleCount: puzzleIds.length,
    remainingPuzzleCount,
    contentStatus: contentStatus(chapter, puzzleIds.length),
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
    summaries.find((chapter) => chapter.unlocked) ||
    summaries[0]
  );
}

export function nextLockedChapter(progress: PlayerProgress) {
  return chapterSummaries(progress).find((chapter) => !chapter.unlocked);
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

function puzzleGroupKey(puzzle: ComposablePuzzle) {
  return [
    (puzzle as any).source_pack_path,
    puzzle.asset,
    puzzle.scene,
    puzzle.category,
    puzzle.collection,
  ]
    .filter(Boolean)
    .join("|");
}

function puzzleSpreadScore(
  puzzle: ComposablePuzzle,
  progress: PlayerProgress
) {
  const recentIds = progress.recentPlayedPuzzleIds || [];
  const recentIndexes = progress.recentPuzzleIndexes || [];

  let score = Math.random();

  if (recentIds.includes(puzzle.id)) {
    score -= 10000;
  }

  const recentPuzzles = recentIds
    .map((id) => PUZZLES.find((item) => item.id === id))
    .filter(Boolean) as ComposablePuzzle[];

  const candidateGroup = puzzleGroupKey(puzzle);
  const lastPuzzle = recentPuzzles[0];
  const lastGroup = lastPuzzle ? puzzleGroupKey(lastPuzzle) : "";

  if (candidateGroup && candidateGroup === lastGroup) {
    score -= 5000;
  }

  recentPuzzles.slice(0, 8).forEach((recentPuzzle, index) => {
    const recencyPenalty = 40 - index * 4;

    if (puzzle.asset && recentPuzzle.asset === puzzle.asset) {
      score -= recencyPenalty;
    }

    if (puzzle.scene && recentPuzzle.scene === puzzle.scene) {
      score -= Math.max(6, recencyPenalty / 3);
    }

    if (candidateGroup && puzzleGroupKey(recentPuzzle) === candidateGroup) {
      score -= recencyPenalty * 2;
    }
  });

  const index = PUZZLES.findIndex((item) => item.id === puzzle.id);

  if (index >= 0 && recentIndexes.includes(index)) {
    score -= 10000;
  }

  return score;
}

export function nextChapterPuzzleIndex(
  chapter: ChapterSummary,
  progress: PlayerProgress
) {
  if (!chapter.unlocked || chapter.completed >= chapter.targetPuzzleCount) {
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
  const recentIds = progress.recentPlayedPuzzleIds || [];
  const recentPuzzles = recentIds
    .map((id) => PUZZLES.find((item) => item.id === id))
    .filter(Boolean) as ComposablePuzzle[];
  const lastGroup = recentPuzzles[0] ? puzzleGroupKey(recentPuzzles[0]) : "";

  const nonRepeatingCandidates =
    candidates.length > 1
      ? candidates.filter((puzzle) => puzzleGroupKey(puzzle) !== lastGroup)
      : candidates;

  const scoredCandidates = nonRepeatingCandidates.length
    ? nonRepeatingCandidates
    : candidates;

  const picked = shuffled(scoredCandidates).sort(
    (a, b) => puzzleSpreadScore(b, progress) - puzzleSpreadScore(a, progress)
  )[0];

  const index = PUZZLES.findIndex((puzzle) => puzzle.id === picked.id);

  return index >= 0 ? index : -1;
}

export function nextRouteForChapter(progress: PlayerProgress) {
  const chapter = currentChapter(progress);

  if (!chapter.unlocked) return "/chapter-map";

  if (chapter.completed === 0) {
    return `/chapter-intro?chapter=${chapter.id}`;
  }

  const nextIndex = nextChapterPuzzleIndex(chapter, progress);

  if (nextIndex < 0) {
    return chapter.fullyRestored
      ? `/chapter-complete?chapter=${chapter.id}`
      : "/chapter-map";
  }

  return `/play?mode=chapter&chapter=${chapter.id}&index=${nextIndex}`;
}

export function chapterDisplayNameForPuzzle(puzzle: ComposablePuzzle) {
  const taggedChapter = CHAPTERS.find((item) => item.id === chapterTagForPuzzle(puzzle));

  if (taggedChapter) return taggedChapter.title;

  const collectionId = puzzleCollectionId(puzzle);
  const chapter = CHAPTERS.find((item) => item.collectionIds.includes(collectionId));

  if (chapter) return chapter.title;

  return `${collectionEmoji(collectionId)} ${collectionLabel(collectionId)}`;
}
