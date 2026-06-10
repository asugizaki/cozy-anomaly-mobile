import { TANUKI_NAME, TanukiMood, tanukiImageForMood } from "@/lib/tanuki-character";
import { Image, StyleSheet, Text, View } from "react-native";
import { TypewriterText } from "./TypewriterText";

type Props = {
  mood?: TanukiMood;
  title?: string;
  text: string;
  subtext?: string;
  restartKey?: string | number | boolean;
  compact?: boolean;
};

export function TanukiDialog({
  mood = "guide",
  title = TANUKI_NAME,
  text,
  subtext,
  restartKey,
  compact,
}: Props) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Image
        source={tanukiImageForMood(mood)}
        style={[styles.portrait, compact && styles.portraitCompact]}
        resizeMode="contain"
      />

      <View style={styles.textWrap}>
        <Text style={styles.name}>{title}</Text>

        <TypewriterText
          text={text}
          restartKey={restartKey ?? `${mood}-${text}`}
          speedMs={10}
          style={[styles.dialogue, compact && styles.dialogueCompact]}
        />

        {!!subtext && <Text style={styles.subtext}>{subtext}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
    padding: 13,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },

  cardCompact: {
    padding: 10,
    borderRadius: 20,
    gap: 10,
  },

  portrait: {
    width: 72,
    height: 92,
    alignSelf: "flex-end",
  },

  portraitCompact: {
    width: 54,
    height: 68,
  },

  textWrap: {
    flex: 1,
  },

  name: {
    fontSize: 13,
    fontWeight: "900",
    color: "#92400E",
  },

  dialogue: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7C2D12",
  },

  dialogueCompact: {
    fontSize: 13,
    lineHeight: 18,
  },

  subtext: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#A16207",
  },
});
