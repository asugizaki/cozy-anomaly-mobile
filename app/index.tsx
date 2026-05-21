import { Link } from "expo-router";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <ImageBackground
      source={require("../assets/puzzles/slot_template_test.png")}
      blurRadius={12}
      style={styles.screen}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Cozy Anomaly</Text>
        <Text style={styles.subtitle}>Find the one tiny difference.</Text>

        <Link href="/play" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Start Puzzle</Text>
          </Pressable>
        </Link>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 246, 235, 0.84)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#7B5A43",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#FF5C8A",
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 999,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
});