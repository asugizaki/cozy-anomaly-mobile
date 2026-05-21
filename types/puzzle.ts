export type PuzzleDifficulty = "easy" | "medium" | "hard";

export type Puzzle = {
  id: string;
  title: string;
  scene: string;
  difficulty: PuzzleDifficulty;
  image: number;
  canvas: {
    width: number;
    height: number;
  };
  target: {
    answer: string;
    anomaly_box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    hitbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
};