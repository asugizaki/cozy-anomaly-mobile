import { rollRarity } from "./lootbox-engine";

export function openLootBox() {
  const rarity = rollRarity();

  return {
    rarity,
    reward:
      rarity === "epic"
        ? { type: "coins", amount: 500 }
        : rarity === "rare"
        ? { type: "coins", amount: 200 }
        : { type: "coins", amount: 75 },
  };
}
