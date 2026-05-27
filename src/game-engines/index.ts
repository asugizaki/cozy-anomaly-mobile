import { anomalyEngine } from "./anomaly-engine";
import { hiddenObjectEngine } from "./hidden-object-engine";
import { getGameKind, PuzzleEngine } from "./types";

export function getPuzzleEngine(puzzle: any): PuzzleEngine {
  const kind = getGameKind(puzzle);

  if (kind === "find_hidden_object") {
    return hiddenObjectEngine;
  }

  return anomalyEngine;
}

export type { GameKind, PuzzleEngine, TapPoint } from "./types";
