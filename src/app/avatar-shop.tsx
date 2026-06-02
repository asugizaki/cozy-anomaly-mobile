import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  AVATARS,
  avatarById,
  isAvatarLevelAvailable,
  isAvatarUnlocked,
  selectAvatar,
  unlockAvatar,
} from "@/lib/avatars";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AvatarShopScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const loaded = await loadProgress();
    setProgress(loaded);
  }

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function handleAvatarPress(avatarId: string) {
    const avatar = avatarById(avatarId);
    const unlocked = isAvatarUnlocked(
      avatar,
      progress.unlockedAvatarIds || []
    );

    if (unlocked) {
      const result = await selectAvatar(avatar.id);
      setProgress(result.progress);
      setNotice(`${avatar.name} equipped!`);
      setTimeout(() => setNotice(null), 1400);
      return;
    }

    const result = await unlockAvatar(avatar.id);

    if (!result.success) {
      Alert.alert("Avatar Locked", result.message);
      return;
    }

    const selectResult = await selectAvatar(avatar.id);
    setProgress(selectResult.progress);

    setNotice(result.message);
    setTimeout(() => setNotice(null), 1400);
  }

  const currentAvatar = avatarById(progress.currentAvatarId);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Avatars"
          subtitle="Collect and equip cozy profile art."
        />
        <ResourceSummary progress={progress} notice={notice} compact />

        <View style={styles.profileCard}>
          <Image
            source={currentAvatar.image}
            style={styles.currentAvatarImage}
            resizeMode="contain"
          />

          <View style={styles.profileText}>
            <Text style={styles.profileTitle}>{currentAvatar.name}</Text>
            <Text style={styles.profileMeta}>
              Level {progress.level || 1} · 🪙 {progress.coins || 0} coins
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {AVATARS.map((avatar) => {
            const unlocked = isAvatarUnlocked(
              avatar,
              progress.unlockedAvatarIds || []
            );

            const selected = progress.currentAvatarId === avatar.id;
            const levelAvailable = isAvatarLevelAvailable(
              avatar,
              progress.level || 1
            );

            const canAfford = (progress.coins || 0) >= avatar.cost;
            const canUnlock = !unlocked && levelAvailable && canAfford;

            return (
              <Pressable
                key={avatar.id}
                style={[
                  styles.avatarCard,
                  selected && styles.selectedCard,
                  !levelAvailable && styles.lockedCard,
                ]}
                onPress={() => handleAvatarPress(avatar.id)}
              >
                <Image
                  source={avatar.image}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />

                <Text style={styles.avatarName}>{avatar.name}</Text>

                <Text style={styles.avatarDescription}>
                  {avatar.description}
                </Text>

                <View style={styles.cardFooter}>
                  {selected ? (
                    <Text style={styles.selectedText}>Selected</Text>
                  ) : unlocked ? (
                    <Text style={styles.unlockedText}>Tap to equip</Text>
                  ) : !levelAvailable ? (
                    <Text style={styles.lockedText}>
                      Level {avatar.unlockLevel}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.costText,
                        canUnlock && styles.canUnlockText,
                      ]}
                    >
                      🪙 {avatar.cost}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7EAD8",
  },

  content: {
    padding: 20,
    paddingBottom: 36,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backText: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "white",
    marginBottom: 18,
  },

  currentAvatarImage: {
    width: 72,
    height: 72,
  },

  profileText: {
    flex: 1,
  },

  profileTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4B2E20",
  },

  profileMeta: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: "#7B5A43",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  avatarCard: {
    width: "48%",
    minHeight: 210,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "transparent",
  },

  selectedCard: {
    borderColor: "#FF5C8A",
    backgroundColor: "#FFF2F6",
  },

  lockedCard: {
    opacity: 0.58,
  },

  avatarImage: {
    width: 92,
    height: 92,
    alignSelf: "center",
  },

  avatarName: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  avatarDescription: {
    marginTop: 6,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#7B5A43",
    textAlign: "center",
  },

  cardFooter: {
    marginTop: 10,
    alignItems: "center",
  },

  selectedText: {
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    color: "white",
    fontSize: 12,
    fontWeight: "900",
  },

  unlockedText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#22c55e",
  },

  lockedText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7B5A43",
  },

  costText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7B5A43",
  },

  canUnlockText: {
    color: "#FF5C8A",
  },
});
