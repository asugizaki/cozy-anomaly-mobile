export type LootBoxRarity = "common" | "rare" | "epic";

export const BASE_LOOTBOX_PRICE = 250;

export function rollRarity(): LootBoxRarity {
  const r = Math.random();

  if (r < 0.7) return "common";
  if (r < 0.95) return "rare";

  return "epic";
}

export function rarityLabel(rarity: LootBoxRarity) {
  if (rarity === "epic") return "EPIC";
  if (rarity === "rare") return "RARE";
  return "COMMON";
}

export function rarityEmoji(rarity: LootBoxRarity) {
  if (rarity === "epic") return "✨";
  if (rarity === "rare") return "⭐";
  return "🎁";
}
