import React from "react";
import { StyleSheet } from "react-native";
import {
    Gesture,
    GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

export type ZoomTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
  onTap: (
    screenX: number,
    screenY: number,
    transform: ZoomTransform
  ) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 3;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export function ZoomablePuzzle({
  children,
  disabled = false,
  onTap,
}: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event) => {
      if (disabled) return;

      runOnJS(onTap)(event.absoluteX, event.absoluteY, {
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      });
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;

      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(
        savedScale.value * event.scale,
        MIN_SCALE,
        MAX_SCALE
      );

      scale.value = nextScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        savedScale.value = 1;

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1.01) return;

      translateX.value =
        savedTranslateX.value + event.translationX;

      translateY.value =
        savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={styles.container}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  content: {
    ...StyleSheet.absoluteFillObject,
  },
});