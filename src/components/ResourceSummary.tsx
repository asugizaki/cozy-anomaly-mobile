import { PlayerProgress } from "@/lib/player-progress";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  progress: PlayerProgress;
  notice?: string | null;
  compact?: boolean;
};

export function ResourceSummary({ progress, notice, compact }: Props) {
  return (
    <View>
      <View style={[styles.bar, compact && styles.compactBar]}>
        <View style={styles.resourcePill}>
          <Text style={styles.energyIcon}>⚡</Text>
          <Text style={styles.value}>{progress.energy || 0}</Text>
        </View>

        <View style={styles.resourcePill}>
          <Image
            source={require("../../assets/ui/coin.png")}
            style={styles.coinIcon}
            resizeMode="contain"
          />
          <Text style={styles.value}>{progress.coins || 0}</Text>
        </View>

        <View style={styles.resourcePill}>
          <Text style={styles.crateIcon}>🎁</Text>
          <Text style={styles.value}>{progress.lootBoxes || 0}</Text>
        </View>
      </View>

      {!!notice && (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 14,
  },

  compactBar: {
    marginBottom: 8,
  },

  resourcePill: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.93)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  energyIcon: {
    fontSize: 19,
  },

  crateIcon: {
    fontSize: 18,
  },

  coinIcon: {
    width: 22,
    height: 22,
  },

  value: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  noticeCard: {
    marginTop: -2,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  noticeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
});
