import { Puzzle } from "@/types/puzzle";
import metadata from "../assets/puzzles/slot_template_test.json";

export const PUZZLES: Puzzle[] = [
  {
    id: metadata.id,
    title: "Cozy Shelf 001",
    scene: metadata.scene,
    difficulty: metadata.difficulty,
    image: require("../assets/puzzles/slot_template_test.png"),
    canvas: metadata.canvas,
    target: metadata.target,
  },
];