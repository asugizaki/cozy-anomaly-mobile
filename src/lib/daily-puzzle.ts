import { PUZZLES } from "@/data/puzzles";

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function getDailyPuzzleIndex(date = new Date()) {
  if (PUZZLES.length === 0) return 0;

  const seed = date.getFullYear() * 1000 + dayOfYear(date);

  return seed % PUZZLES.length;
}