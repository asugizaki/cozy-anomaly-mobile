import { AVATARS, avatarById } from "./avatars";
import { rollRarity, BASE_LOOTBOX_PRICE, LootBoxRarity } from "./lootbox-engine";
import { loadProgress, PlayerProgress, saveProgress } from "./player-progress";
import { lootBoxDiscount } from "./skill-tree";
import { TITLES, titleById } from "./titles";

export type LootboxReward =
  | {
      type: "coins";
      amount: number;
      label: string;
      emoji: string;
    }
  | {
      type: "avatar";
      avatarId: string;
      label: string;
      emoji: string;
      duplicateConvertedToCoins?: number;
    }
  | {
      type: "title";
      titleId: string;
      label: string;
      emoji: string;
      duplicateConvertedToCoins?: number;
    };

export type LootboxOpenResult = {
  success: boolean;
  message: string;
  rarity?: LootBoxRarity;
  reward?: LootboxReward;
  progress: PlayerProgress;
};

export function lootBoxPrice(progress: PlayerProgress) {
  const discount = lootBoxDiscount(progress);
  return Math.max(50, Math.round(BASE_LOOTBOX_PRICE * (1 - discount)));
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function coinRewardForRarity(rarity: LootBoxRarity) {
  if (rarity === "epic") return randomItem([300, 400, 500]);
  if (rarity === "rare") return randomItem([150, 200, 250]);

  return randomItem([50, 75, 100]);
}

function duplicateCoinsForRarity(rarity: LootBoxRarity) {
  if (rarity === "epic") return 300;
  if (rarity === "rare") return 150;

  return 75;
}

function avatarDrop(progress: PlayerProgress, rarity: LootBoxRarity): LootboxReward {
  const unlocked = new Set(progress.unlockedAvatarIds || []);
  const eligible = AVATARS.filter((avatar) => {
    if (avatar.cost === 0) return false;
    if (avatar.unlockLevel && avatar.unlockLevel > (progress.level || 1)) return false;
    return !unlocked.has(avatar.id);
  });

  if (!eligible.length) {
    const amount = duplicateCoinsForRarity(rarity);

    return {
      type: "coins",
      amount,
      label: "Duplicate protection coins",
      emoji: "🪙",
    };
  }

  const avatar = randomItem(eligible);

  return {
    type: "avatar",
    avatarId: avatar.id,
    label: avatar.name,
    emoji: avatar.emoji,
  };
}

function titleDrop(progress: PlayerProgress, rarity: LootBoxRarity): LootboxReward {
  const unlocked = new Set(progress.unlockedTitleIds || []);
  const eligible = TITLES.filter((title) => !unlocked.has(title.id));

  if (!eligible.length) {
    const amount = duplicateCoinsForRarity(rarity);

    return {
      type: "coins",
      amount,
      label: "Duplicate title protection",
      emoji: "🪙",
    };
  }

  const title = randomItem(eligible);

  return {
    type: "title",
    titleId: title.id,
    label: title.name,
    emoji: "🏆",
  };
}

function generateReward(progress: PlayerProgress, rarity: LootBoxRarity): LootboxReward {
  const roll = Math.random();

  if (rarity === "epic") {
    if (roll < 0.45) return avatarDrop(progress, rarity);
    if (roll < 0.75) return titleDrop(progress, rarity);

    const amount = coinRewardForRarity(rarity);
    return {
      type: "coins",
      amount,
      label: `${amount} coins`,
      emoji: "🪙",
    };
  }

  if (rarity === "rare") {
    if (roll < 0.25) return avatarDrop(progress, rarity);
    if (roll < 0.4) return titleDrop(progress, rarity);

    const amount = coinRewardForRarity(rarity);
    return {
      type: "coins",
      amount,
      label: `${amount} coins`,
      emoji: "🪙",
    };
  }

  const amount = coinRewardForRarity(rarity);

  return {
    type: "coins",
    amount,
    label: `${amount} coins`,
    emoji: "🪙",
  };
}

function applyReward(progress: PlayerProgress, reward: LootboxReward): PlayerProgress {
  if (reward.type === "coins") {
    return {
      ...progress,
      coins: (progress.coins || 0) + reward.amount,
      lifetimeCoins: (progress.lifetimeCoins || 0) + reward.amount,
    };
  }

  if (reward.type === "avatar") {
    const avatar = avatarById(reward.avatarId);

    return {
      ...progress,
      unlockedAvatarIds: [
        avatar.id,
        ...(progress.unlockedAvatarIds || []).filter((id) => id !== avatar.id),
      ],
      currentAvatarId: avatar.id,
    };
  }

  const title = titleById(reward.titleId);

  return {
    ...progress,
    unlockedTitleIds: [
      title.id,
      ...(progress.unlockedTitleIds || []).filter((id) => id !== title.id),
    ],
    equippedTitleId: title.id,
  };
}

export async function buyLootBox() {
  const progress = await loadProgress();
  const price = lootBoxPrice(progress);

  if ((progress.coins || 0) < price) {
    return {
      success: false,
      message: `You need ${price} coins.`,
      progress,
    };
  }

  const updated = {
    ...progress,
    coins: (progress.coins || 0) - price,
    lootBoxes: (progress.lootBoxes || 0) + 1,
  };

  await saveProgress(updated);

  return {
    success: true,
    message: "Cozy crate purchased.",
    progress: updated,
  };
}

export async function openLootBox(): Promise<LootboxOpenResult> {
  const progress = await loadProgress();

  if ((progress.lootBoxes || 0) <= 0) {
    return {
      success: false,
      message: "You do not have any loot boxes.",
      progress,
    };
  }

  const rarity = rollRarity();
  const reward = generateReward(progress, rarity);

  const afterReward = applyReward(
    {
      ...progress,
      lootBoxes: Math.max(0, (progress.lootBoxes || 0) - 1),
      lootBoxesOpened: (progress.lootBoxesOpened || 0) + 1,
    },
    reward
  );

  await saveProgress(afterReward);

  return {
    success: true,
    message: "Loot box opened.",
    rarity,
    reward,
    progress: afterReward,
  };
}
