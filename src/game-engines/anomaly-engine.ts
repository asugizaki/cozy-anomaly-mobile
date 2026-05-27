import { ComposablePuzzle } from "@/types/puzzle";
import { PuzzleEngine, TapPoint } from "./types";

function cleanAnswer(answer: string) {
  return answer.replace(/\.$/, "");
}

function isInsideAnswerBox(point: TapPoint, puzzle: ComposablePuzzle) {
  const box = puzzle.answer_box;

  return (
    point.x >= box.x1 &&
    point.x <= box.x2 &&
    point.y >= box.y1 &&
    point.y <= box.y2
  );
}

export const anomalyEngine: PuzzleEngine = {
  kind: "find_anomaly",

  title: "Find the anomaly",

  subtitle: "Tap the tiny difference.",

  checkTap(point, puzzle) {
    return isInsideAnswerBox(point, puzzle);
  },

  genericHint(puzzle) {
    const answer = puzzle.answer.toLowerCase();

    if (answer.includes("missing")) {
      return `Look for the ${puzzle.asset} with a missing detail.`;
    }

    if (answer.includes("recolor") || answer.includes("color")) {
      return `Look for the ${puzzle.asset} with a recolored part.`;
    }

    if (answer.includes("bigger")) {
      return `Look for the ${puzzle.asset} with a bigger part.`;
    }

    if (answer.includes("smaller")) {
      return `Look for the ${puzzle.asset} with a smaller part.`;
    }

    return `Look for the ${puzzle.asset} with a subtle difference.`;
  },

  preciseHint(puzzle) {
    return cleanAnswer(puzzle.answer).replace(/^One\s+/i, "Look for the ");
  },
};