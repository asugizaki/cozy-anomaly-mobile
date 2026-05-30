import { Achievement } from "@/lib/achievements";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  achievement: Achievement;
};

export function AchievementCard({ achievement }: Props) {
  const progress = achievement.current / achievement.target;
  const unlocked = progress >= 1;
  const width = `${Math.min(progress * 100, 100)}%`;

  return (
    <View style={[styles.card, unlocked && styles.unlockedCard]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{achievement.emoji}</Text>

        <View style={styles.textWrap}>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>

        <Text style={styles.status}>{unlocked ? "✓" : ""}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width,
            },
          ]}
        />
      </View>

      <Text style={styles.progressText}>
        {achievement.current}/{achievement.target}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.65)",
  },

  unlockedCard: {
    borderColor: "#FFB703",
    backgroundColor: "rgba(255,248,225,0.98)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  emoji: {
    fontSize: 30,
  },

  textWrap: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4B2E20",
  },

  description: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: "#8A654C",
    lineHeight: 18,
  },

  status: {
    width: 28,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#22c55e",
  },

  progressTrack: {
    height: 9,
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "rgba(75,46,32,0.16)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  progressText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "900",
    color: "#7B5A43",
    textAlign: "right",
  },
});
