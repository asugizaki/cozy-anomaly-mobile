import { submitBetaFeedback, BetaFeedbackPayload } from "@/lib/beta-feedback";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES: Array<{ id: BetaFeedbackPayload["type"]; label: string }> = [
  { id: "bug", label: "Bug" },
  { id: "confusing", label: "Confusing" },
  { id: "too_easy", label: "Too Easy" },
  { id: "too_hard", label: "Too Hard" },
  { id: "idea", label: "Idea" },
  { id: "other", label: "Other" },
];

export default function BetaFeedbackScreen() {
  const params = useLocalSearchParams<{
    screen?: string;
    chapterId?: string;
    puzzleId?: string;
  }>();

  const [type, setType] = useState<BetaFeedbackPayload["type"]>("bug");
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!message.trim()) {
      Alert.alert("Feedback", "Please write a short note first.");
      return;
    }

    setSending(true);

    const result = await submitBetaFeedback({
      type,
      rating,
      message: message.trim(),
      screen: String(params.screen || ""),
      chapterId: String(params.chapterId || ""),
      puzzleId: String(params.puzzleId || ""),
    });

    setSending(false);

    Alert.alert("Feedback", result.message, [
      {
        text: "OK",
        onPress: () => {
          if (result.success) router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.title}>Beta Feedback</Text>
            <Text style={styles.subtitle}>
              Help make Hidden Tanuki better before launch.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>What kind of feedback?</Text>

        <View style={styles.typeGrid}>
          {TYPES.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.typeButton, type === item.id && styles.typeActive]}
              onPress={() => setType(item.id)}
            >
              <Text
                style={[
                  styles.typeText,
                  type === item.id && styles.typeTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Overall feeling</Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              style={[
                styles.ratingButton,
                rating === value && styles.ratingActive,
              ]}
              onPress={() => setRating(value)}
            >
              <Text style={styles.ratingText}>★</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>What happened?</Text>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Example: The bonus Tanuki was hard to tap, or I ran out of energy too fast..."
          placeholderTextColor="#9CA3AF"
          multiline
          style={styles.textArea}
        />

        <View style={styles.contextBox}>
          <Text style={styles.contextTitle}>Context</Text>
          <Text style={styles.contextText}>Screen: {params.screen || "unknown"}</Text>
          <Text style={styles.contextText}>Chapter: {params.chapterId || "n/a"}</Text>
          <Text style={styles.contextText}>Puzzle: {params.puzzleId || "n/a"}</Text>
        </View>

        <Pressable
          style={[styles.submitButton, sending && styles.disabledButton]}
          onPress={submit}
          disabled={sending}
        >
          <Text style={styles.submitText}>
            {sending ? "Sending..." : "Send Feedback"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF3E2" },
  content: { padding: 18, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 40, color: "#4B2E20", marginTop: -5 },
  headerCopy: { flex: 1 },
  title: { fontSize: 30, fontWeight: "900", color: "#4B2E20" },
  subtitle: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7B5A43",
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 9,
    fontSize: 15,
    fontWeight: "900",
    color: "#4B2E20",
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "white",
  },
  typeActive: { backgroundColor: "#FF5C8A" },
  typeText: { fontSize: 14, fontWeight: "900", color: "#4B2E20" },
  typeTextActive: { color: "white" },
  ratingRow: { flexDirection: "row", gap: 9 },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingActive: { backgroundColor: "#F59E0B" },
  ratingText: { fontSize: 24, color: "#92400E" },
  textArea: {
    minHeight: 160,
    borderRadius: 20,
    backgroundColor: "white",
    padding: 14,
    color: "#4B2E20",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    textAlignVertical: "top",
  },
  contextBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  contextTitle: { fontSize: 13, fontWeight: "900", color: "#4B2E20" },
  contextText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: "#7B5A43",
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: "white", fontSize: 17, fontWeight: "900" },
});
