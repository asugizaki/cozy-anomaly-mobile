
import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { claimBonusTanukiReward } from "@/lib/bonus-tanuki";
import { DEFAULT_PROGRESS, PlayerProgress } from "@/lib/player-progress";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { loadProgressWithEnergy } from "@/lib/energy";

export default function BonusTanukiScreen() {
  const [progress,setProgress]=useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(useCallback(()=>{ loadProgressWithEnergy().then(setProgress); },[]));

  async function findTanuki() {
    const result = await claimBonusTanukiReward();
    setProgress(result.progress);

    if (!result.success) {
      Alert.alert("Bonus Mode", result.message);
      return;
    }

    Alert.alert(
      "🦝 Tanuki Found!",
      `+${result.reward.xp} XP\n+${result.reward.coins} Coins${
        result.reward.lootBoxes ? `\n+${result.reward.lootBoxes} Crate` : ""
      }${
        result.reward.avatarUnlocked ? "\nLegendary Avatar Unlocked!" : ""
      }`
    );
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Find the Tanuki" subtitle="Bonus reward mode" />
        <ResourceSummary progress={progress} compact />

        <View style={styles.card}>
          <Text style={styles.tanuki}>🦝</Text>
          <Text style={styles.title}>Bonus Tickets</Text>
          <Text style={styles.count}>{progress.bonusTanukiTickets || 0}</Text>

          <Text style={styles.text}>
            After repairing a chapter milestone, Tanuki hides somewhere.
            Find him to earn boosted rewards and a small chance at a rare avatar.
          </Text>

          <Pressable
            style={[
              styles.button,
              !(progress.bonusTanukiTickets || 0) && styles.disabled,
            ]}
            disabled={!(progress.bonusTanukiTickets || 0)}
            onPress={findTanuki}
          >
            <Text style={styles.buttonText}>Find Tanuki</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppBackground>
  );
}
const styles=StyleSheet.create({
content:{padding:20,paddingBottom:40},
card:{padding:24,borderRadius:28,backgroundColor:"rgba(255,255,255,0.95)",alignItems:"center"},
tanuki:{fontSize:80},
title:{fontSize:24,fontWeight:"900",color:"#4B2E20"},
count:{fontSize:40,fontWeight:"900",color:"#FF5C8A",marginVertical:10},
text:{textAlign:"center",fontSize:14,lineHeight:20,color:"#7B5A43"},
button:{marginTop:20,paddingHorizontal:24,paddingVertical:14,borderRadius:999,backgroundColor:"#FF5C8A"},
disabled:{backgroundColor:"#9CA3AF"},
buttonText:{color:"white",fontWeight:"900"}
});
