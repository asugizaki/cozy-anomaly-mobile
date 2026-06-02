import {
  claimNotifications,
  ClaimNotification,
} from "@/lib/notifications";
import { PlayerProgress } from "@/lib/player-progress";
import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";

type Props = {
  progress?: PlayerProgress | null;
};

export function NotificationBell({ progress }: Props) {
  const [open, setOpen] = useState(false);

  const notifications = useMemo(
    () => claimNotifications(progress),
    [progress]
  );

  function openNotification(notification: ClaimNotification) {
    setOpen(false);
    router.push(notification.href as any);
  }

  return (
    <>
      <Pressable style={styles.bellButton} onPress={() => setOpen(true)}>
        <Text style={styles.bellText}>🔔</Text>

        {notifications.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notifications.length > 9 ? "9+" : notifications.length}
            </Text>
          </View>
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Rewards</Text>

              <Pressable onPress={() => setOpen(false)} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptyText}>
                  Complete missions, events, crates, or skill upgrades to see them here.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {notifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    style={styles.notificationCard}
                    onPress={() => openNotification(notification)}
                  >
                    <Text style={styles.notificationEmoji}>
                      {notification.emoji}
                    </Text>

                    <View style={styles.notificationText}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  bellText: {
    fontSize: 24,
  },

  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 88,
    paddingHorizontal: 18,
  },

  panel: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFF7EC",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  panelTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#4B2E20",
  },

  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(75,46,32,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    color: "#4B2E20",
  },

  list: {
    marginTop: 14,
    gap: 10,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(75,46,32,0.08)",
  },

  notificationEmoji: {
    fontSize: 28,
  },

  notificationText: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4B2E20",
  },

  notificationMessage: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#7B5A43",
  },

  chevron: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FF5C8A",
  },

  emptyCard: {
    marginTop: 14,
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    backgroundColor: "white",
  },

  emptyEmoji: {
    fontSize: 36,
  },

  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: "#4B2E20",
  },

  emptyText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#7B5A43",
    textAlign: "center",
  },
});
