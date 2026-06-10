import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function ConfettiBurst({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }).start();
  }, [active, anim]);

  const pieces = ["🎊", "✨", "🌸", "🎉", "⭐", "💫", "🍃", "✨"];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => {
        const left = `${8 + index * 12}%`;
        const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${index % 2 ? -60 : 60}deg`] });
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 520 + index * 25] });
        const opacity = anim.interpolate({ inputRange: [0, 0.08, 0.82, 1], outputRange: [0, 1, 1, 0] });

        return (
          <Animated.View key={`${piece}-${index}`} style={[styles.piece, { left: left as any, opacity, transform: [{ translateY }, { rotate }] }]}>
            <Text style={styles.text}>{piece}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: "absolute", top: -20 },
  text: { fontSize: 28 },
});
