import { PlayerProgress } from "@/lib/player-progress";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  current: number;
  target: number;
};

function clampProgress(value: number, target: number) {
  return Math.min(Math.max(value || 0, 0), target);
}

export function achievementsForProgress(
  progress: PlayerProgress
): Achievement[] {
  const solved = progress.totalSolved || progress.completedPuzzleIds.length || 0;
  const bestStreak = progress.bestStreak || progress.currentStreak || 0;

  return [
    {
      id: "first_find",
      title: "First Find",
      description: "Solve your first puzzle.",
      emoji: "🔎",
      current: clampProgress(solved, 1),
      target: 1,
    },
    {
      id: "getting_warm",
      title: "Getting Warm",
      description: "Solve 10 puzzles.",
      emoji: "🔥",
      current: clampProgress(solved, 10),
      target: 10,
    },
    {
      id: "detective",
      title: "Detective",
      description: "Solve 100 puzzles.",
      emoji: "🕵️",
      current: clampProgress(solved, 100),
      target: 100,
    },
    {
      id: "sharp_eyes",
      title: "Sharp Eyes",
      description: "Solve 500 puzzles.",
      emoji: "👀",
      current: clampProgress(solved, 500),
      target: 500,
    },
    {
      id: "perfectionist",
      title: "Perfectionist",
      description: "Complete 10 puzzles with no wrong taps and no hints.",
      emoji: "💎",
      current: clampProgress(progress.perfectGames, 10),
      target: 10,
    },
    {
      id: "hint_seeker",
      title: "Hint Seeker",
      description: "Use 50 hints.",
      emoji: "💡",
      current: clampProgress(progress.hintsUsed, 50),
      target: 50,
    },
    {
      id: "daily_grinder",
      title: "Daily Grinder",
      description: "Complete 30 daily challenges.",
      emoji: "☀️",
      current: clampProgress(progress.dailyChallengesCompleted, 30),
      target: 30,
    },
    {
      id: "unstoppable",
      title: "Unstoppable",
      description: "Reach a 30-puzzle streak.",
      emoji: "🚀",
      current: clampProgress(bestStreak, 30),
      target: 30,
    },
  ];
}

export function unlockedAchievementCount(progress: PlayerProgress) {
  return achievementsForProgress(progress).filter(
    (achievement) => achievement.current >= achievement.target
  ).length;
}
