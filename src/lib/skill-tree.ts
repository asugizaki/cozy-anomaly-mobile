export type SkillNodeId =
  | "xp_boost_1"
  | "xp_boost_2"
  | "hint_bonus_1"
  | "hint_bonus_2"
  | "coin_boost_1"
  | "coin_boost_2";

export const SKILL_NODES = [
  {
    id: "xp_boost_1",
    name: "+10% XP",
    cost: 1,
  },
  {
    id: "xp_boost_2",
    name: "+20% XP",
    cost: 2,
  },
  {
    id: "hint_bonus_1",
    name: "+1 Daily Hint",
    cost: 1,
  },
  {
    id: "hint_bonus_2",
    name: "+2 Daily Hints",
    cost: 2,
  },
  {
    id: "coin_boost_1",
    name: "+10% Coins",
    cost: 1,
  },
  {
    id: "coin_boost_2",
    name: "+20% Coins",
    cost: 2,
  },
];
