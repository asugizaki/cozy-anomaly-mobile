export function xpForLevel(level: number) {
  if (level <= 1) return 0;

  return Math.round(75 * Math.pow(level - 1, 1.45));
}

export function levelForXp(totalXp: number) {
  let level = 1;

  while (xpForLevel(level + 1) <= totalXp) {
    level += 1;
  }

  return level;
}

export function xpProgress(totalXp: number) {
  const level = levelForXp(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeeded,
    progress: xpNeeded ? xpIntoLevel / xpNeeded : 1,
  };
}
