
import { View, Text, StyleSheet } from "react-native";

export function ChapterCelebrationCard({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>Chapter restored!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{padding:24,borderRadius:24,backgroundColor:"#fff",alignItems:"center"},
  emoji:{fontSize:48},
  title:{fontSize:22,fontWeight:"900"},
  text:{marginTop:8}
});
