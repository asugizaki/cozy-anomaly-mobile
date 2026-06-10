import AsyncStorage from "@react-native-async-storage/async-storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Platform } from "react-native";
import { firebaseAuth, firebaseConfigured, firestore } from "./firebase";

const INSTALL_ID_KEY = "analytics_install_id";
const QUEUE_KEY = "analytics_event_queue_v1";
const MAX_QUEUE_SIZE = 100;
const FLUSH_BATCH_SIZE = 15;

export type AnalyticsEventName =
  | "app_open"
  | "ad_rewarded_loaded"
  | "ad_rewarded_failed_to_load"
  | "ad_rewarded_shown"
  | "ad_rewarded_earned"
  | "ad_rewarded_closed"
  | "ad_rewarded_unavailable"
  | string;

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type QueuedAnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  createdAt: number;
};

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function installId() {
  const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);

  if (existing) return existing;

  const created = `install_${randomId()}`;
  await AsyncStorage.setItem(INSTALL_ID_KEY, created);

  return created;
}

async function readQueue(): Promise<QueuedAnalyticsEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(events: QueuedAnalyticsEvent[]) {
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(events.slice(-MAX_QUEUE_SIZE))
  );
}

async function enqueue(event: QueuedAnalyticsEvent) {
  const queue = await readQueue();
  await writeQueue([...queue, event]);
}

function cleanPayload(payload: AnalyticsPayload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

async function sendEvent(event: QueuedAnalyticsEvent) {
  if (!firebaseConfigured()) throw new Error("Firebase is not configured.");

  await addDoc(collection(firestore, "analyticsEvents"), {
    name: event.name,
    payload: cleanPayload(event.payload),
    installId: await installId(),
    userId: firebaseAuth.currentUser?.uid || null,
    platform: Platform.OS,
    app: "hidden_tanuki",
    createdAtMs: event.createdAt,
    createdAt: serverTimestamp(),
  });
}

export async function trackAnalyticsEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {}
) {
  const event: QueuedAnalyticsEvent = {
    id: randomId(),
    name,
    payload: cleanPayload(payload),
    createdAt: Date.now(),
  };

  try {
    await sendEvent(event);
  } catch {
    await enqueue(event);
  }
}

export async function flushAnalyticsQueue() {
  const queue = await readQueue();
  const remaining = [...queue];
  let sent = 0;

  for (const event of queue.slice(0, FLUSH_BATCH_SIZE)) {
    try {
      await sendEvent(event);
      remaining.shift();
      sent += 1;
    } catch {
      break;
    }
  }

  await writeQueue(remaining);

  return {
    sent,
    remaining: remaining.length,
  };
}
