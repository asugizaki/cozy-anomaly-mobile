import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type Props = {
  active: boolean;
};

const SPARKLES = [
  { id: "a", x: "18%", y: "28%", delay: 0 },
  { id: "b", x: "76%", y: "24%", delay: 120 },
  { id: "c", x: "52%", y: "40%", delay: 220 },
  { id: "d", x: "28%", y: "57%", delay: 340 },
  { id: "e", x: "82%", y: "62%", delay: 450 },
  { id: "f", x: "44%", y: "72%", delay: 560 },
];

export function SparkleBurst({ active }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      anim.setValue(0);
      return;
    }

    anim.setValue(0);

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: 620,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, anim]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {SPARKLES.map((sparkle, index) => {
        const opacity = anim.interpolate({
          inputRange: [0, 0.2, 0.72, 1],
          outputRange: [0, 1, 1, 0],
        });

        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4 + index * 0.02, 1.8],
        });

        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, -36 - index * 3],
        });

        return (
          <Animated.View
            key={sparkle.id}
            style={[
              styles.sparkle,
              {
                left: sparkle.x as any,
                top: sparkle.y as any,
                opacity,
                transform: [{ scale }, { translateY }],
              },
            ]}
          >
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: "absolute",
  },

  sparkleText: {
    fontSize: 34,
  },
});
