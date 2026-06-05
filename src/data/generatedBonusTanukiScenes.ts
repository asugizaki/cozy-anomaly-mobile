import { ImageSourcePropType } from "react-native";

export type BonusTanukiRewardConfig = {
  xp: number;
  coins: number;
  energy: number;
  lootBoxChance: number;
  rareAvatarChance: number;
};

export type BonusTanukiScene = {
  id: string;
  title: string;
  chapter_id?: string;
  background: string;
  backgroundSource: ImageSourcePropType;
  canvas?: {
    width: number;
    height: number;
  };
  target: {
    x: number;
    y: number;
    radius: number;
  };
  attempts: number;
  reward: BonusTanukiRewardConfig;
};

export const BONUS_TANUKI_SCENES: BonusTanukiScene[] = [
  {
    ...{
        "schema": "hidden_tanuki_bonus_scene_v1",
        "id": "matcha_cafe_bonus_01",
        "title": "Matcha Cafe Bonus",
        "chapter_id": "matcha_cafe",
        "background": "assets/bonus-tanuki/matcha_cafe_bonus_01/background.jpg",
        "target": {
            "x": 0.5,
            "y": 0.5,
            "radius": 0.08
        },
        "attempts": 3,
        "reward": {
            "xp": 200,
            "coins": 250,
            "energy": 1,
            "lootBoxChance": 0.25,
            "rareAvatarChance": 0.05
        },
        "canvas": {
            "width": 741,
            "height": 1600
        }
    },
    backgroundSource: require("../../assets/bonus-tanuki/matcha_cafe_bonus_01/background.jpg"),
  },
  {
    ...{
        "schema": "hidden_tanuki_bonus_scene_v1",
        "id": "matcha_cafe_bonus_02",
        "title": "Matcha Cafe Bonus 2",
        "chapter_id": "matcha_cafe",
        "background": "assets/bonus-tanuki/matcha_cafe_bonus_02/background.jpg",
        "target": {
            "x": 0.5,
            "y": 0.5,
            "radius": 0.08
        },
        "attempts": 3,
        "reward": {
            "xp": 200,
            "coins": 250,
            "energy": 1,
            "lootBoxChance": 0.25,
            "rareAvatarChance": 0.05
        },
        "canvas": {
            "width": 741,
            "height": 1600
        }
    },
    backgroundSource: require("../../assets/bonus-tanuki/matcha_cafe_bonus_02/background.jpg"),
  },
  {
    ...{
        "schema": "hidden_tanuki_bonus_scene_v1",
        "id": "matcha_cafe_bonus_03",
        "title": "Matcha Cafe Bonus 3",
        "chapter_id": "matcha_cafe",
        "background": "assets/bonus-tanuki/matcha_cafe_bonus_03/background.jpg",
        "target": {
            "x": 0.5,
            "y": 0.5,
            "radius": 0.08
        },
        "attempts": 3,
        "reward": {
            "xp": 200,
            "coins": 250,
            "energy": 1,
            "lootBoxChance": 0.25,
            "rareAvatarChance": 0.05
        },
        "canvas": {
            "width": 741,
            "height": 1600
        }
    },
    backgroundSource: require("../../assets/bonus-tanuki/matcha_cafe_bonus_03/background.jpg"),
  },
  {
    ...{
        "schema": "hidden_tanuki_bonus_scene_v1",
        "id": "matcha_cafe_bonus_04",
        "title": "Matcha Cafe Bonus 4",
        "chapter_id": "matcha_cafe",
        "background": "assets/bonus-tanuki/matcha_cafe_bonus_04/background.jpg",
        "target": {
            "x": 0.5,
            "y": 0.5,
            "radius": 0.08
        },
        "attempts": 3,
        "reward": {
            "xp": 200,
            "coins": 250,
            "energy": 1,
            "lootBoxChance": 0.25,
            "rareAvatarChance": 0.05
        },
        "canvas": {
            "width": 741,
            "height": 1600
        }
    },
    backgroundSource: require("../../assets/bonus-tanuki/matcha_cafe_bonus_04/background.jpg"),
  }
];

export function bonusTanukiScenesForChapter(chapterId?: string) {
  const matches = BONUS_TANUKI_SCENES.filter(
    (scene) => !chapterId || scene.chapter_id === chapterId
  );

  return matches.length ? matches : BONUS_TANUKI_SCENES;
}

export function randomBonusTanukiScene(chapterId?: string) {
  const scenes = bonusTanukiScenesForChapter(chapterId);

  if (!scenes.length) return undefined;

  return scenes[Math.floor(Math.random() * scenes.length)];
}
