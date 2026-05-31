export type LootReward = {
  type: "coins" | "avatar";
  value: string | number;
};

export const LOOT_BOX_COST = 250;

export function generateLootReward(): LootReward {
  const roll = Math.random();

  if (roll < 0.8) {
    return {
      type: "coins",
      value: 50 + Math.floor(Math.random() * 151),
    };
  }

  return {
    type: "avatar",
    value: "random_avatar",
  };
}
