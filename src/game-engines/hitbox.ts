import { AnswerBox, ComposablePuzzle } from "@/types/puzzle";
import { TapPoint } from "./types";

const MIN_TAP_SIZE_BY_DIFFICULTY: Record<string, number> = {
  easy: 132,
  medium: 112,
  hard: 96,
};

const EXTRA_PADDING_BY_DIFFICULTY: Record<string, number> = {
  easy: 22,
  medium: 18,
  hard: 14,
};

function normalizeBox(box: AnswerBox): AnswerBox {
  return {
    x1: Math.min(box.x1, box.x2),
    y1: Math.min(box.y1, box.y2),
    x2: Math.max(box.x1, box.x2),
    y2: Math.max(box.y1, box.y2),
  };
}

function expandedBox(box: AnswerBox, puzzle: ComposablePuzzle): AnswerBox {
  const normalized = normalizeBox(box);

  const width = Math.max(1, normalized.x2 - normalized.x1);
  const height = Math.max(1, normalized.y2 - normalized.y1);

  const centerX = normalized.x1 + width / 2;
  const centerY = normalized.y1 + height / 2;

  const minSize =
    MIN_TAP_SIZE_BY_DIFFICULTY[puzzle.difficulty] ||
    MIN_TAP_SIZE_BY_DIFFICULTY.medium;

  const extraPadding =
    EXTRA_PADDING_BY_DIFFICULTY[puzzle.difficulty] ||
    EXTRA_PADDING_BY_DIFFICULTY.medium;

  const targetWidth = Math.max(width + extraPadding * 2, minSize);
  const targetHeight = Math.max(height + extraPadding * 2, minSize);

  return {
    x1: centerX - targetWidth / 2,
    y1: centerY - targetHeight / 2,
    x2: centerX + targetWidth / 2,
    y2: centerY + targetHeight / 2,
  };
}

export function isInsideTapBox(point: TapPoint, puzzle: ComposablePuzzle) {
  const box = expandedBox(puzzle.answer_box, puzzle);

  return (
    point.x >= box.x1 &&
    point.x <= box.x2 &&
    point.y >= box.y1 &&
    point.y <= box.y2
  );
}

export function debugTapBox(puzzle: ComposablePuzzle) {
  return expandedBox(puzzle.answer_box, puzzle);
}
