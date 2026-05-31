export function canPrestige(level: number) {
  return level >= 25;
}

export function prestigeBonus(level: number) {
  return Math.floor(level / 5);
}
