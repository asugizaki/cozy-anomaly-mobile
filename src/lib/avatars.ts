import { loadProgress, saveProgress } from "./player-progress";

export type AvatarDefinition = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  unlockLevel?: number;
  description: string;
};

export const AVATARS: AvatarDefinition[] = [
  {
    id: "tanuki",
    name: "Tanuki",
    emoji: "🦝",
    cost: 0,
    description: "Your cozy starter avatar.",
  },
  {
    id: "daruma",
    name: "Daruma",
    emoji: "🔴",
    cost: 100,
    unlockLevel: 2,
    description: "Lucky, focused, and impossible to distract.",
  },
  {
    id: "fox",
    name: "Kitsune",
    emoji: "🦊",
    cost: 150,
    unlockLevel: 3,
    description: "Sharp eyes for tiny hidden details.",
  },
  {
    id: "cat",
    name: "Cafe Cat",
    emoji: "🐱",
    cost: 175,
    unlockLevel: 4,
    description: "A relaxed puzzle buddy for cozy scenes.",
  },
  {
    id: "ramen",
    name: "Ramen Bowl",
    emoji: "🍜",
    cost: 225,
    unlockLevel: 5,
    description: "Fueled by noodles and observation skills.",
  },
  {
    id: "tea",
    name: "Tea Cup",
    emoji: "🍵",
    cost: 275,
    unlockLevel: 6,
    description: "Calm, patient, and great at hard puzzles.",
  },
  {
    id: "star",
    name: "Star Detective",
    emoji: "⭐",
    cost: 400,
    unlockLevel: 8,
    description: "For players who keep finding every anomaly.",
  },
];

export function defaultAvatarId() {
  return "tanuki";
}

export function avatarById(id?: string) {
  return (
    AVATARS.find((avatar) => avatar.id === id) ||
    AVATARS.find((avatar) => avatar.id === defaultAvatarId())!
  );
}

export function isAvatarUnlocked(
  avatar: AvatarDefinition,
  unlockedAvatarIds: string[]
) {
  return avatar.cost === 0 || unlockedAvatarIds.includes(avatar.id);
}

export function isAvatarLevelAvailable(
  avatar: AvatarDefinition,
  level: number
) {
  return !avatar.unlockLevel || level >= avatar.unlockLevel;
}

export async function unlockAvatar(avatarId: string) {
  const progress = await loadProgress();
  const avatar = avatarById(avatarId);

  const unlockedAvatarIds = progress.unlockedAvatarIds || [defaultAvatarId()];

  if (isAvatarUnlocked(avatar, unlockedAvatarIds)) {
    return {
      success: true,
      message: "Already unlocked.",
      progress,
    };
  }

  if (!isAvatarLevelAvailable(avatar, progress.level || 1)) {
    return {
      success: false,
      message: `Reach Level ${avatar.unlockLevel} first.`,
      progress,
    };
  }

  if ((progress.coins || 0) < avatar.cost) {
    return {
      success: false,
      message: `You need ${avatar.cost} coins.`,
      progress,
    };
  }

  const updated = {
    ...progress,
    coins: (progress.coins || 0) - avatar.cost,
    unlockedAvatarIds: [avatar.id, ...unlockedAvatarIds],
  };

  await saveProgress(updated);

  return {
    success: true,
    message: `${avatar.name} unlocked.`,
    progress: updated,
  };
}

export async function selectAvatar(avatarId: string) {
  const progress = await loadProgress();
  const avatar = avatarById(avatarId);
  const unlockedAvatarIds = progress.unlockedAvatarIds || [defaultAvatarId()];

  if (!isAvatarUnlocked(avatar, unlockedAvatarIds)) {
    return {
      success: false,
      message: "Unlock this avatar first.",
      progress,
    };
  }

  const updated = {
    ...progress,
    currentAvatarId: avatar.id,
  };

  await saveProgress(updated);

  return {
    success: true,
    message: `${avatar.name} selected.`,
    progress: updated,
  };
}
