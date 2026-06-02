import { AppBackground } from "@/components/AppBackground";
import { ResourceSummary } from "@/components/ResourceSummary";
import { ScreenHeader } from "@/components/ScreenHeader";
import { loadProgressWithEnergy } from "@/lib/energy";
import {
  DEFAULT_PROGRESS,
  PlayerProgress,
} from "@/lib/player-progress";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type HubItem = {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
};

const ITEMS: HubItem[] = [
  {
    href: "/collections",
    emoji: "📚",
    title: "Collections",
    subtitle: "Continue themed puzzle packs.",
  },
  {
    href: "/missions",
    emoji: "✅",
    title: "Daily Missions",
    subtitle: "Earn XP, coins, energy, and crates.",
  },
  {
    href: "/event",
    emoji: "🎉",
    title: "Event",
    subtitle: "Limited-time goals and bonus rewards.",
  },
  {
    href: "/lootboxes",
    emoji: "🎁",
    title: "Loot Boxes",
    subtitle: "Open crates for coins, avatars, and titles.",
  },
  {
    href: "/skill-tree",
    emoji: "🌳",
    title: "Skill Tree",
    subtitle: "Spend skill points on permanent boosts.",
  },
  {
    href: "/avatar-shop",
    emoji: "🧑‍🎨",
    title: "Avatars",
    subtitle: "Unlock and equip cozy profile avatars.",
  },
  {
    href: "/stats",
    emoji: "🏆",
    title: "Stats",
    subtitle: "Track progress and achievements.",
  },
];

export default function HubScreen() {
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgressWithEnergy().then(setProgress);
    }, [])
  );

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Progress Hub"
          subtitle="Rewards, events, upgrades, and cosmetics."
        />
        <ResourceSummary progress={progress} compact />

        <View style={styles.grid}>
          {ITEMS.map((item) => (
            <Link key={item.href} href={item.href as any} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.emoji}>{item.emoji}</Text>

                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backText: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "rgba(255,255,255,0.88)",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
  },

  summaryNumber: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4B2E20",
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "900",
    color: "#7B5A43",
    textTransform: "uppercase",
  },

  grid: {
    gap: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 17,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.70)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  emoji: {
    fontSize: 32,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  cardSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#7B5A43",
  },
});
