import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: "#4B2E20",
    fontWeight: "900",
    marginTop: -3,
  },

  textWrap: {
    paddingHorizontal: 2,
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.50)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
});
