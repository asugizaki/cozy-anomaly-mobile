import { AppBackground } from "@/components/AppBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  DEFAULT_SETTINGS,
  GameSettings,
  loadSettings,
  saveSettings,
} from "@/lib/game-settings";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
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
    <AppBackground>
      <Text style={styles.title}>Settings</Text>

      <Link href="/account" asChild>
        <Pressable style={styles.accountButton}>
          <Text style={styles.accountButtonText}>☁️ Account & Cloud Save</Text>
        </Pressable>
      </Link>

      {__DEV__ && (
        <Link href="/dev-tools" asChild>
          <Pressable style={styles.devButton}>
            <Text style={styles.devButtonText}>🛠 Developer Tools</Text>
          </Pressable>
        </Link>
      )}

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
    </AppBackground>
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
  accountButton: {
    marginBottom: 14,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
  },

  accountButtonText: {
    color: "#4B2E20",
    fontSize: 15,
    fontWeight: "900",
  },

  devButton: {
    marginBottom: 14,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  devButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },

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