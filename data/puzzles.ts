import { Puzzle } from "@/types/puzzle";
import metadata from "../assets/puzzles/cozy_puzzle_001.json";

export const PUZZLES: Puzzle[] = [
  {
    id: metadata.id,
    title: "Cozy Shelf 001",
    scene: metadata.scene,
    difficulty: metadata.difficulty,
    image: require("../assets/puzzles/cozy_puzzle_001.png"),
    canvas: metadata.canvas,
    target: metadata.target,
  },
];