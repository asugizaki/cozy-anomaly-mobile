import { CHAPTERS, chapterSummary } from "./chapters";
import { PlayerProgress } from "./player-progress";

export type ChapterInventoryStatus = "ok" | "warning" | "critical" | "exhausted";

export type ChapterInventory = {
  chapterId: string;
  title: string;
  targetPuzzleCount: number;
  availablePuzzleCount: number;
  completedPuzzleCount: number;
  remainingPuzzleCount: number;
  warnRemaining: number;
  criticalRemaining: number;
  status: ChapterInventoryStatus;
};

export function chapterInventory(progress: PlayerProgress): ChapterInventory[] {
  let previousComplete = true;

  return CHAPTERS.map((chapter) => {
    const summary = chapterSummary(chapter, progress, previousComplete);
    previousComplete = summary.fullyRestored;

    const warnRemaining = (chapter as any).warnRemaining ?? 20;
    const criticalRemaining = (chapter as any).criticalRemaining ?? 10;
    const remainingPuzzleCount = Math.max(
      0,
      summary.puzzleIds.length - summary.completed
    );

    let status: ChapterInventoryStatus = "ok";

    if (remainingPuzzleCount <= 0) {
      status = "exhausted";
    } else if (remainingPuzzleCount <= criticalRemaining) {
      status = "critical";
    } else if (remainingPuzzleCount <= warnRemaining) {
      status = "warning";
    }

    return {
      chapterId: chapter.id,
      title: chapter.title,
      targetPuzzleCount: chapter.targetPuzzleCount,
      availablePuzzleCount: summary.puzzleIds.length,
      completedPuzzleCount: summary.completed,
      remainingPuzzleCount,
      warnRemaining,
      criticalRemaining,
      status,
    };
  });
}

export function chaptersNeedingContent(progress: PlayerProgress) {
  return chapterInventory(progress).filter((chapter) =>
    ["warning", "critical", "exhausted"].includes(chapter.status)
  );
}
