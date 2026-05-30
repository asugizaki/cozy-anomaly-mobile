import { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
} from "react-native";

type Props = {
  x: number;
  y: number;
};

export function AnimatedWrongMarker({ x, y }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.75)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),

      Animated.timing(scale, {
        toValue: 1.35,
        duration: 650,
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: -26,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.marker,
        {
          left: x - 18,
          top: y - 18,
          opacity,
          transform: [
            { scale },
            { translateY },
          ],
        },
      ]}
    >
      <Text style={styles.text}>✕</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    zIndex: 999,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    marginTop: -2,
  },
});