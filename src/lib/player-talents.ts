export type PlayerTalents = {
  skillPoints: number;
  unlockedNodes: string[];
};

export const DEFAULT_TALENTS: PlayerTalents = {
  skillPoints: 0,
  unlockedNodes: [],
};
