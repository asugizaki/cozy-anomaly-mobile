import { AppBackground } from "@/components/AppBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/lib/auth-context";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function formatSyncTime(value?: number) {
  if (!value) return "Never";

  return new Date(value).toLocaleString();
}

export default function AccountScreen() {
  const {
    user,
    initializing,
    firebaseReady,
    cloudSync,
    signInWithGoogle,
    signOutUser,
    syncNow,
    uploadNow,
    downloadNow,
  } = useAuth();

  async function confirmDownload() {
    Alert.alert(
      "Restore cloud save?",
      "This replaces local progress with the saved cloud progress.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: downloadNow,
        },
      ]
    );
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Account"
          subtitle="Save your XP, coins, energy, crates, avatars, and progress."
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cloud Save</Text>

          {!firebaseReady && (
            <Text style={styles.warningText}>
              Firebase is not configured yet. Add the EXPO_PUBLIC_FIREBASE_* and
              Google client ID environment variables.
            </Text>
          )}

          {initializing ? (
            <View style={styles.centerRow}>
              <ActivityIndicator />
              <Text style={styles.metaText}>Checking account...</Text>
            </View>
          ) : user ? (
            <>
              <Text style={styles.nameText}>
                {user.displayName || "Signed in"}
              </Text>
              <Text style={styles.metaText}>{user.email}</Text>

              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {cloudSync.syncing
                    ? "Syncing..."
                    : `Last sync: ${formatSyncTime(cloudSync.lastSyncAt)}`}
                </Text>
              </View>

              {!!cloudSync.error && (
                <Text style={styles.errorText}>{cloudSync.error}</Text>
              )}

              <View style={styles.buttonStack}>
                <Pressable style={styles.primaryButton} onPress={syncNow}>
                  <Text style={styles.primaryButtonText}>Sync Now</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={uploadNow}>
                  <Text style={styles.secondaryButtonText}>
                    Upload Local Save
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={confirmDownload}
                >
                  <Text style={styles.secondaryButtonText}>
                    Restore Cloud Save
                  </Text>
                </Pressable>

                <Pressable style={styles.dangerButton} onPress={signOutUser}>
                  <Text style={styles.dangerButtonText}>Sign Out</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.metaText}>
                Sign in so progress survives reinstalling the app and can sync
                across devices.
              </Text>

              {!!cloudSync.error && (
                <Text style={styles.errorText}>{cloudSync.error}</Text>
              )}

              <Pressable
                disabled={!firebaseReady}
                style={[
                  styles.primaryButton,
                  !firebaseReady && styles.disabledButton,
                ]}
                onPress={signInWithGoogle}
              >
                <Text style={styles.primaryButtonText}>
                  Continue with Google
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What gets saved?</Text>
          <Text style={styles.infoText}>
            XP, levels, coins, energy, crates, avatars, titles, skill tree,
            completed puzzles, missions, events, and collection rewards.
          </Text>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
  },

  card: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.70)",
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4B2E20",
    marginBottom: 10,
  },

  nameText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4B2E20",
  },

  metaText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#7B5A43",
  },

  warningText: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  errorText: {
    marginTop: 10,
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  statusPill: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },

  statusText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },

  buttonStack: {
    marginTop: 18,
    gap: 10,
  },

  primaryButton: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#6A3F2B",
    fontSize: 15,
    fontWeight: "900",
  },

  dangerButton: {
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
  },

  dangerButtonText: {
    color: "#991B1B",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.45,
  },

  infoCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.88)",
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  infoText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#7B5A43",
  },

  backButton: {
    marginTop: 16,
    alignItems: "center",
  },

  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
});
