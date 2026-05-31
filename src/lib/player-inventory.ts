export type PlayerInventory = {
  titles: string[];
  lootBoxesOpened: number;
};

export const DEFAULT_INVENTORY: PlayerInventory = {
  titles: [],
  lootBoxesOpened: 0,
};
