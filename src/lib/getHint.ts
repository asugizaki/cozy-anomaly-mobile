import { PuzzleData } from "@/types/puzzle";

export function getHint(
  puzzle: PuzzleData,
  level: number
): string {
  if (puzzle.game_type === "find_anomaly") {
    return anomalyHint(
      puzzle,
      level
    );
  }

  if (puzzle.game_type === "find_tanuki") {
    return tanukiHint(
      puzzle,
      level
    );
  }

  return "Keep looking.";
}

function anomalyHint(
  puzzle: PuzzleData,
  level: number
): string {
  const anomaly =
    puzzle.anomaly ?? "";

  if (level === 1) {
    if (anomaly.startsWith("missing_")) {
      return "Look for an item with a missing detail.";
    }

    if (anomaly.startsWith("recolored_")) {
      return "Look for an item with a recolored part.";
    }

    if (anomaly.startsWith("bigger_")) {
      return "Look for an item with a larger part.";
    }

    if (anomaly.startsWith("smaller_")) {
      return "Look for an item with a smaller part.";
    }

    return "Look carefully for a difference.";
  }

  if (level === 2) {
    return puzzle.answer;
  }

  return "FINAL_HINT";
}

function tanukiHint(
  puzzle: PuzzleData,
  level: number
): string {
  if (level === 1) {
    return "The tanuki is not near the center.";
  }

  if (level === 2) {
    return "Check one quadrant carefully.";
  }

  return "FINAL_HINT";
}