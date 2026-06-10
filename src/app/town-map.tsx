
import { ScrollView, Text, View } from "react-native";

const chapters = [
  { id: "matcha", title: "Matcha Cafe", emoji: "🍵", stars: 3, unlocked: true },
  { id: "kissaten", title: "Retro Kissaten", emoji: "☕", stars: 0, unlocked: true },
  { id: "festival", title: "Festival Street", emoji: "🏮", stars: 0, unlocked: false },
];

export default function TownMapScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 30, fontWeight: "900", marginBottom: 20 }}>
        Tanuki Town
      </Text>

      {chapters.map((chapter) => (
        <View
          key={chapter.id}
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            opacity: chapter.unlocked ? 1 : 0.4,
          }}
        >
          <Text style={{ fontSize: 26 }}>
            {chapter.emoji}
          </Text>

          <Text style={{ fontSize: 20, fontWeight: "900" }}>
            {chapter.title}
          </Text>

          <Text>
            {"⭐".repeat(chapter.stars)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
