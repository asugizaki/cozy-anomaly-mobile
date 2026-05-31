import { isFavoritePuzzle, toggleFavoritePuzzle } from "@/lib/favorites";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  puzzleId: string;
};

export function FavoriteButton({ puzzleId }: Props) {
  const [favorite, setFavorite] = useState(false);

  useFocusEffect(
    useCallback(() => {
      isFavoritePuzzle(puzzleId).then(setFavorite);
    }, [puzzleId])
  );

  async function toggle() {
    const next = await toggleFavoritePuzzle(puzzleId);
    setFavorite(next);
  }

  return (
    <Pressable
      onPress={toggle}
      style={[styles.button, favorite && styles.activeButton]}
      hitSlop={10}
    >
      <Text style={styles.text}>{favorite ? "♥" : "♡"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 7,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(75,46,32,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  activeButton: {
    backgroundColor: "#FF5C8A",
  },

  text: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
  },
});
