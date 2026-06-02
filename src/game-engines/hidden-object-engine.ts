import { isInsideTapBox } from "./hitbox";
import { PuzzleEngine } from "./types";

function cleanAnswer(answer: string) {
  return answer.replace(/\.$/, "");
}

export const hiddenObjectEngine: PuzzleEngine = {
  kind: "find_hidden_object",

  title: "Find the hidden item",

  subtitle: "Search the scene carefully.",

  checkTap(point, puzzle) {
    return isInsideTapBox(point, puzzle);
  },

  genericHint() {
    return "Look carefully through the scene. The hidden item blends into the background.";
  },

  preciseHint(puzzle) {
    return cleanAnswer(puzzle.answer);
  },
};
