import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
import { equipTitle, TITLES } from "@/lib/titles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TitlesScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  async function handleEquip(titleId: string) {
    const result = await equipTitle(titleId);

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Title Locked", result.message);
    }
  }

  const unlocked = new Set(progress.unlockedTitleIds || []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Titles</Text>

        <Text style={styles.subtitle}>
          Equip titles earned from loot boxes and progression.
        </Text>

        <View style={styles.list}>
          {TITLES.map((title) => {
            const isUnlocked = unlocked.has(title.id);
            const equipped = progress.equippedTitleId === title.id;

            return (
              <Pressable
                key={title.id}
                style={[
                  styles.card,
                  equipped && styles.equippedCard,
                  !isUnlocked && styles.lockedCard,
                ]}
                onPress={() => handleEquip(title.id)}
              >
                <View>
                  <Text style={styles.cardTitle}>{title.name}</Text>
                  <Text style={styles.cardDescription}>
                    {title.description}
                  </Text>
                </View>

                <Text style={styles.statusText}>
                  {equipped ? "Equipped" : isUnlocked ? "Tap to equip" : "Locked"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    color: "#4B2E20",
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#4B2E20",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#7B5A43",
  },

  list: {
    gap: 12,
  },

  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "transparent",
  },

  equippedCard: {
    borderColor: "#FF5C8A",
    backgroundColor: "#FFF2F6",
  },

  lockedCard: {
    opacity: 0.55,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#7B5A43",
  },

  statusText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "900",
    color: "#FF5C8A",
  },
});
