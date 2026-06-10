import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { TypewriterText } from "./TypewriterText";

type Props = {
  mood?: "guide" | "thinking" | "happy";
  title?: string;
  text: string;
  buttonText?: string;
  onPress?: () => void;
  compact?: boolean;
};

const TANUKI_IMAGES: Record<string, ImageSourcePropType> = {
  guide: require("../../assets/characters/tanuki_guide.png"),
  thinking: require("../../assets/characters/tanuki_thinking.png"),
  happy: require("../../assets/characters/tanuki_happy.png"),
};

export function TanukiDialogueCard({
  mood = "guide",
  title = "Pon",
  text,
  buttonText,
  onPress,
  compact,
}: Props) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Image source={TANUKI_IMAGES[mood]} style={[styles.tanuki, compact && styles.compactTanuki]} resizeMode="contain" />

      <View style={styles.textWrap}>
        <Text style={styles.name}>{title}</Text>
        <TypewriterText text={text} restartKey={`${mood}-${text}`} speedMs={11} style={styles.text} />

        {!!buttonText && !!onPress && (
          <Pressable style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 28,
    backgroundColor: "rgba(255,247,236,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  compactCard: { padding: 11, borderRadius: 22 },
  tanuki: { width: 92, height: 118, alignSelf: "flex-end" },
  compactTanuki: { width: 66, height: 82 },
  textWrap: { flex: 1, justifyContent: "center" },
  name: { fontSize: 13, fontWeight: "900", color: "#FF5C8A", textTransform: "uppercase", letterSpacing: 0.8 },
  text: { marginTop: 4, fontSize: 15, lineHeight: 21, fontWeight: "800", color: "#6A3F2B" },
  button: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, backgroundColor: "#FF5C8A", alignItems: "center" },
  buttonText: { color: "white", fontSize: 15, fontWeight: "900" },
});
