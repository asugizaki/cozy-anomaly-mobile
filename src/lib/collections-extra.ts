export function collectionCompletionPercent(
  completed: number,
  total: number
) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function collectionRemaining(
  completed: number,
  total: number
) {
  return Math.max(0, total - completed);
}
