import { View, Text, StyleSheet } from "react-native";

export function TanukiDialogueCard({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.avatar}>🦝</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
  },
  avatar: {
    fontSize: 34,
  },
  text: {
    flex: 1,
    fontWeight: "800",
    color: "#7C2D12",
  },
});
