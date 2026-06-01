import {
  canUnlockSkill,
  SkillNode,
  SKILL_NODES,
  unlockSkillNode,
} from "@/lib/skill-tree";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  PlayerProgress,
} from "@/lib/player-progress";
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

export default function SkillTreeScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  async function refresh() {
    const loaded = await loadProgress();
    setProgress(loaded);
  }

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function handleUnlock(node: SkillNode) {
    const result = await unlockSkillNode(node.id);

    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Skill Locked", result.message);
    }
  }

  const unlocked = new Set(progress.unlockedSkillNodeIds || []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Skill Tree</Text>

        <Text style={styles.subtitle}>
          Spend skill points earned from leveling up.
        </Text>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsNumber}>🌟 {progress.skillPoints || 0}</Text>
          <Text style={styles.pointsLabel}>Available Skill Points</Text>
        </View>

        <View style={styles.list}>
          {SKILL_NODES.map((node) => {
            const isUnlocked = unlocked.has(node.id);
            const canUnlock = canUnlockSkill(progress, node);

            return (
              <Pressable
                key={node.id}
                disabled={isUnlocked}
                style={[
                  styles.nodeCard,
                  isUnlocked && styles.unlockedCard,
                  !isUnlocked && !canUnlock && styles.lockedCard,
                ]}
                onPress={() => handleUnlock(node)}
              >
                <View style={styles.nodeHeader}>
                  <View>
                    <Text style={styles.nodeBranch}>{node.branch}</Text>
                    <Text style={styles.nodeTitle}>{node.name}</Text>
                  </View>

                  <Text style={styles.nodeCost}>
                    {isUnlocked ? "✓" : `🌟 ${node.cost}`}
                  </Text>
                </View>

                <Text style={styles.nodeDescription}>
                  {node.description}
                </Text>

                {!!node.requires?.length && (
                  <Text style={styles.requirementText}>
                    Requires: {node.requires.join(", ")}
                  </Text>
                )}
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

  pointsCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#FF5C8A",
    marginBottom: 16,
  },

  pointsNumber: {
    fontSize: 38,
    fontWeight: "900",
    color: "white",
  },

  pointsLabel: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: "white",
  },

  list: {
    gap: 12,
  },

  nodeCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "transparent",
  },

  unlockedCard: {
    borderColor: "#22c55e",
    backgroundColor: "#F0FDF4",
  },

  lockedCard: {
    opacity: 0.68,
  },

  nodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  nodeBranch: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FF5C8A",
    textTransform: "uppercase",
  },

  nodeTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  nodeCost: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  nodeDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#7B5A43",
  },

  requirementText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#9B745A",
  },
});
