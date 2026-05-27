import AsyncStorage from "@react-native-async-storage/async-storage";

export type GameSettings = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  hapticsEnabled: true,
  musicVolume: 0.35,
  sfxVolume: 0.8,
};

const SETTINGS_KEY = "game_settings";

export async function loadSettings(): Promise<GameSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: GameSettings) {
  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}