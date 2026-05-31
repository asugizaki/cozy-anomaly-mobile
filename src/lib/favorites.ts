import { loadProgress, saveProgress } from "./player-progress";

export async function isFavoritePuzzle(puzzleId: string): Promise<boolean> {
  const progress = await loadProgress();
  return (progress.favoritePuzzleIds || []).includes(puzzleId);
}

export async function toggleFavoritePuzzle(puzzleId: string): Promise<boolean> {
  const progress = await loadProgress();
  const current = progress.favoritePuzzleIds || [];
  const isFavorite = current.includes(puzzleId);

  const favoritePuzzleIds = isFavorite
    ? current.filter((id) => id !== puzzleId)
    : [puzzleId, ...current];

  await saveProgress({
    ...progress,
    favoritePuzzleIds,
  });

  return !isFavorite;
}
