import { ECONOMY_CONFIG } from "./economy-config";
import { PlayerProgress, loadProgress, saveProgress } from "./player-progress";

export type SkillNodeId =
  | "xp_boost_1"
  | "xp_boost_2"
  | "coin_boost_1"
  | "coin_boost_2"
  | "crate_discount_1"
  | "crate_discount_2"
  | "daily_bonus_1"
  | "perfect_bonus_1";

export type SkillNode = {
  id: SkillNodeId;
  name: string;
  description: string;
  cost: number;
  branch: "Explorer" | "Collector" | "Rewards";
  requires?: SkillNodeId[];
};

export const SKILL_NODES: SkillNode[] = [
  {
    id: "xp_boost_1",
    name: "Explorer I",
    description: "+10% XP from puzzle rewards.",
    cost: 1,
    branch: "Explorer",
  },
  {
    id: "xp_boost_2",
    name: "Explorer II",
    description: "+20% XP from puzzle rewards.",
    cost: 2,
    branch: "Explorer",
    requires: ["xp_boost_1"],
  },
  {
    id: "coin_boost_1",
    name: "Collector I",
    description: "+10% coins from puzzle rewards.",
    cost: 1,
    branch: "Collector",
  },
  {
    id: "coin_boost_2",
    name: "Collector II",
    description: "+20% coins from puzzle rewards.",
    cost: 2,
    branch: "Collector",
    requires: ["coin_boost_1"],
  },
  {
    id: "crate_discount_1",
    name: "Bargain Crates I",
    description: "Loot boxes cost 10% fewer coins.",
    cost: 1,
    branch: "Rewards",
  },
  {
    id: "crate_discount_2",
    name: "Bargain Crates II",
    description: "Loot boxes cost 20% fewer coins.",
    cost: 2,
    branch: "Rewards",
    requires: ["crate_discount_1"],
  },
  {
    id: "daily_bonus_1",
    name: "Daily Focus",
    description: "+10 bonus XP from daily challenges.",
    cost: 1,
    branch: "Explorer",
  },
  {
    id: "perfect_bonus_1",
    name: "Perfect Eye",
    description: "+10 bonus coins for perfect clears.",
    cost: 1,
    branch: "Collector",
  },
];

export function hasSkill(progress: PlayerProgress, id: SkillNodeId) {
  return (progress.unlockedSkillNodeIds || []).includes(id);
}

export function xpMultiplier(progress: PlayerProgress) {
  if (hasSkill(progress, "xp_boost_2")) return 1 + ECONOMY_CONFIG.skills.xpBoost2;
  if (hasSkill(progress, "xp_boost_1")) return 1 + ECONOMY_CONFIG.skills.xpBoost1;
  return 1;
}

export function coinMultiplier(progress: PlayerProgress) {
  if (hasSkill(progress, "coin_boost_2")) return 1 + ECONOMY_CONFIG.skills.coinBoost2;
  if (hasSkill(progress, "coin_boost_1")) return 1 + ECONOMY_CONFIG.skills.coinBoost1;
  return 1;
}

export function lootBoxDiscount(progress: PlayerProgress) {
  if (hasSkill(progress, "crate_discount_2")) return ECONOMY_CONFIG.skills.crateDiscount2;
  if (hasSkill(progress, "crate_discount_1")) return ECONOMY_CONFIG.skills.crateDiscount1;
  return 0;
}

export function canUnlockSkill(progress: PlayerProgress, node: SkillNode) {
  if (hasSkill(progress, node.id)) return false;
  if ((progress.skillPoints || 0) < node.cost) return false;

  return (node.requires || []).every((required) => hasSkill(progress, required));
}

export async function unlockSkillNode(nodeId: SkillNodeId) {
  const progress = await loadProgress();
  const node = SKILL_NODES.find((item) => item.id === nodeId);

  if (!node) {
    return {
      success: false,
      message: "Unknown skill.",
      progress,
    };
  }

  if (!canUnlockSkill(progress, node)) {
    return {
      success: false,
      message: "Not enough skill points or missing prerequisite.",
      progress,
    };
  }

  const updated: PlayerProgress = {
    ...progress,
    skillPoints: progress.skillPoints - node.cost,
    spentSkillPoints: (progress.spentSkillPoints || 0) + node.cost,
    unlockedSkillNodeIds: [node.id, ...(progress.unlockedSkillNodeIds || [])],
  };

  await saveProgress(updated);

  return {
    success: true,
    message: `${node.name} unlocked.`,
    progress: updated,
  };
}
