export type LootboxReward =
  | { type: "coins"; amount: number }
  | { type: "avatar"; avatarId: string };

export const COMMON_COIN_REWARDS = [50, 75, 100];
export const RARE_COIN_REWARDS = [150, 200, 250];
export const EPIC_COIN_REWARDS = [300, 500];
