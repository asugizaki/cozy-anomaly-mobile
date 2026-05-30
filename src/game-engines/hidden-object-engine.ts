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

export const hiddenObjectEngine: PuzzleEngine = {
  kind: "find_hidden_object",

  title: "Find the hidden item",

  subtitle: "Search the scene carefully.",

  checkTap(point, puzzle) {
    return isInsideAnswerBox(point, puzzle);
  },

  genericHint() {
    return "Look carefully through the scene. The hidden item blends into the background.";
  },

  preciseHint(puzzle) {
    return cleanAnswer(puzzle.answer);
  },
};