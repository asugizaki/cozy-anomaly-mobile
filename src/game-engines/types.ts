import { ComposablePuzzle } from "@/types/puzzle";

export type GameKind = "find_anomaly" | "find_hidden_object";

export type TapPoint = {
  x: number;
  y: number;
};

export type PuzzleEngine = {
  kind: GameKind;
  title: string;
  subtitle: string;
  checkTap: (point: TapPoint, puzzle: ComposablePuzzle) => boolean;
  genericHint: (puzzle: ComposablePuzzle) => string;
  preciseHint: (puzzle: ComposablePuzzle) => string;
};

export function getGameKind(puzzle: any): GameKind {
  return puzzle.game_type || puzzle.kind || "find_anomaly";
}