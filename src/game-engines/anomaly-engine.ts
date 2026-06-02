import { isInsideTapBox } from "./hitbox";
import { PuzzleEngine } from "./types";

function cleanAnswer(answer: string) {
  return answer.replace(/\.$/, "");
}

function articleFor(text: string) {
  return /^[aeiou]/i.test(text.trim()) ? "an" : "a";
}

export const anomalyEngine: PuzzleEngine = {
  kind: "find_anomaly",

  title: "Find the anomaly",

  subtitle: "Tap the tiny difference.",

  checkTap(point, puzzle) {
    return isInsideTapBox(point, puzzle);
  },

  genericHint(puzzle) {
    if (puzzle.hint_type === "missing_part") {
      return `Look for the ${puzzle.asset} with a missing detail.`;
    }

    if (puzzle.hint_type === "recolored_part") {
      return `Look for the ${puzzle.asset} with a recolored part.`;
    }

    if (puzzle.hint_type === "scaled_part") {
      return `Look for the ${puzzle.asset} with a part that looks too big or too small.`;
    }

    return `Look for the ${puzzle.asset} with a subtle difference.`;
  },

  preciseHint(puzzle) {
    const target = puzzle.hint_target?.trim();

    if (puzzle.hint_type === "missing_part" && target) {
      return `Look for the ${puzzle.asset} missing ${articleFor(target)} ${target}.`;
    }

    if (puzzle.hint_type === "recolored_part" && target) {
      return `Look for the ${puzzle.asset} with a recolored ${target}.`;
    }

    if (puzzle.hint_type === "scaled_part" && target) {
      return `Look for the ${puzzle.asset} with an oddly sized ${target}.`;
    }

    return cleanAnswer(puzzle.answer);
  },
};
