
import { Text, View } from "react-native";

export default function PonDialog({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 24,
        padding: 18,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "900" }}>
        🦝 {title}
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 16,
          lineHeight: 24,
        }}
      >
        {body}
      </Text>
    </View>
  );
}
