import { View, Text, StyleSheet } from "react-native";

export function RestorationStageCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },
  description: {
    marginTop: 6,
    color: "#7B5A43",
    fontWeight: "700",
  },
});
