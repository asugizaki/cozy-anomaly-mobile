export type CollectionReward = {
  collectionId: string;
  rewardType: "coins" | "lootbox";
  amount: number;
};

export function rewardForCollectionCompletion(collectionId: string) {
  return {
    collectionId,
    rewardType: "lootbox",
    amount: 1,
  };
}
