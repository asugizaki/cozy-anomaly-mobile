import {
  DEFAULT_SETTINGS,
  GameSettings,
  loadSettings,
  saveSettings,
} from "@/lib/game-settings";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [settings, setSettings] =
    useState<GameSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  async function updateSetting(
    key: keyof GameSettings,
    value: any
  ) {
    const updated = {
      ...settings,
      [key]: value,
    };

    setSettings(updated);

    await saveSettings(updated);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Row
          label="Music"
          value={settings.musicEnabled}
          onChange={(value) =>
            updateSetting("musicEnabled", value)
          }
        />

        <Row
          label="Sound Effects"
          value={settings.sfxEnabled}
          onChange={(value) =>
            updateSetting("sfxEnabled", value)
          }
        />

        <Row
          label="Haptics"
          value={settings.hapticsEnabled}
          onChange={(value) =>
            updateSetting("hapticsEnabled", value)
          }
        />
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>

      <Switch
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7EAD8",
    padding: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE5DD",
  },

  rowLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B2E20",
  },
});