import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function SparkleBurst({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      anim.setValue(0);
      return;
    }

    anim.setValue(0);

    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [active, anim]);

  const spots = [
    ["14%", "26%"],
    ["78%", "23%"],
    ["48%", "36%"],
    ["25%", "55%"],
    ["83%", "63%"],
    ["46%", "72%"],
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {spots.map(([left, top], index) => {
        const opacity = anim.interpolate({
          inputRange: [0, 0.15, 0.75, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1.9 + index * 0.05],
        });
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, -36 - index * 4],
        });

        return (
          <Animated.View
            key={`${left}-${top}`}
            style={[
              styles.sparkle,
              {
                left: left as any,
                top: top as any,
                opacity,
                transform: [{ scale }, { translateY }],
              },
            ]}
          >
            <Text style={styles.text}>✨</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sparkle: { position: "absolute" },
  text: { fontSize: 34 },
});
