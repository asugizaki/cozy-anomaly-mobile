import { PUZZLES } from "@/data/puzzles";
import { Puzzle } from "@/types/puzzle";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const MAX_ATTEMPTS = 3;

function isInsideHitbox(x: number, y: number, puzzle: Puzzle) {
  const box = puzzle.target.hitbox;

  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  );
}

export default function PlayScreen() {
  const puzzle = PUZZLES[0];
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [solved, setSolved] = useState(false);

  const imageSize = useMemo(() => {
    const horizontalPadding = 24;
    const topArea = 112;
    const bottomArea = 190;

    const maxWidth = screenWidth - horizontalPadding;
    const maxHeight = screenHeight - topArea - bottomArea;

    const canvasAspect = puzzle.canvas.width / puzzle.canvas.height;

    let width = maxWidth;
    let height = width / canvasAspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * canvasAspect;
    }

    return { width, height };
  }, [screenWidth, screenHeight, puzzle.canvas.width, puzzle.canvas.height]);

  const scale = {
    x: imageSize.width / puzzle.canvas.width,
    y: imageSize.height / puzzle.canvas.height,
  };

  const anomalyOverlay = {
    left: puzzle.target.anomaly_box.x * scale.x - 18,
    top: puzzle.target.anomaly_box.y * scale.y - 18,
    width: puzzle.target.anomaly_box.width * scale.x + 36,
    height: puzzle.target.anomaly_box.height * scale.y + 36,
  };

  function handlePress(event: any) {
    if (solved) return;

    const tapX = event.nativeEvent.locationX;
    const tapY = event.nativeEvent.locationY;

    const originalX = tapX / scale.x;
    const originalY = tapY / scale.y;

    if (isInsideHitbox(originalX, originalY, puzzle)) {
      setSolved(true);
      return;
    }

    const nextAttempts = attemptsLeft - 1;
    setAttemptsLeft(nextAttempts);

    if (nextAttempts <= 0) {
      setSolved(true);
      Alert.alert("Answer revealed", puzzle.target.answer);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.iconText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.levelText}>Puzzle 1</Text>
          <Text style={styles.subText}>{puzzle.difficulty.toUpperCase()}</Text>
        </View>

        <View style={styles.triesPill}>
          <Text style={styles.triesText}>Tries: {attemptsLeft}</Text>
        </View>
      </View>

      <View style={styles.puzzleArea}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.puzzleFrame,
            {
              width: imageSize.width,
              height: imageSize.height,
            },
          ]}
        >
          <Image
            source={puzzle.image}
            resizeMode="contain"
            style={{
              width: imageSize.width,
              height: imageSize.height,
            }}
          />

          {solved && (
            <View
              pointerEvents="none"
              style={[
                styles.answerCircle,
                {
                  left: anomalyOverlay.left,
                  top: anomalyOverlay.top,
                  width: anomalyOverlay.width,
                  height: anomalyOverlay.height,
                  borderRadius: Math.max(
                    anomalyOverlay.width,
                    anomalyOverlay.height
                  ),
                },
              ]}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.bottomPanel}>
        {solved ? (
          <>
            <Text style={styles.answerTitle}>Found it!</Text>
            <Text style={styles.answerText}>{puzzle.target.answer}</Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setSolved(false);
                setAttemptsLeft(MAX_ATTEMPTS);
              }}
            >
              <Text style={styles.primaryButtonText}>Replay</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.answerTitle}>Find the anomaly</Text>
            <Text style={styles.answerText}>
              Tap the item that looks different.
            </Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                Alert.alert(
                  "Hint",
                  "Look closely at small facial or accessory details."
                )
              }
            >
              <Text style={styles.secondaryButtonText}>Use Hint</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7EAD8",
  },
  topBar: {
    height: 86,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFFCC",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 38,
    color: "#5A3D2B",
    marginTop: -4,
  },
  levelText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#9B745A",
    textAlign: "center",
  },
  triesPill: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#FFFFFFCC",
  },
  triesText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#5A3D2B",
  },
  puzzleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  puzzleFrame: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#FFF7EC",
  },
  answerCircle: {
    position: "absolute",
    borderWidth: 4,
    borderColor: "#FF4F8A",
    backgroundColor: "rgba(255, 79, 138, 0.08)",
  },
  bottomPanel: {
    margin: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#FFF7EC",
  },
  answerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 4,
  },
  answerText: {
    fontSize: 15,
    color: "#7B5A43",
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#FF5C8A",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#F4D7C4",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 16,
    fontWeight: "900",
  },
});