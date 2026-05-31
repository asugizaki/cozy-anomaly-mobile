export type LootBoxRarity = 'common' | 'rare' | 'epic';

export const LOOTBOX_PRICES = {
  cozy_crate: 250,
};

export function rollRarity(): LootBoxRarity {
  const r = Math.random();
  if (r < 0.70) return 'common';
  if (r < 0.95) return 'rare';
  return 'epic';
}
