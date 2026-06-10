import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firebaseConfigured, firestore } from "./firebase";
import { captureError } from "./error-reporting";

export type BetaFeedbackPayload = {
  type: "bug" | "confusing" | "too_easy" | "too_hard" | "idea" | "other";
  message: string;
  screen?: string;
  chapterId?: string;
  puzzleId?: string;
  rating?: number;
};

export async function submitBetaFeedback(payload: BetaFeedbackPayload) {
  if (!firebaseConfigured()) {
    return {
      success: false,
      message: "Firebase is not configured.",
    };
  }

  try {
    await addDoc(collection(firestore, "betaFeedback"), {
      ...payload,
      app: "hidden_tanuki",
      userId: firebaseAuth.currentUser?.uid || null,
      userEmail: firebaseAuth.currentUser?.email || null,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });

    return {
      success: true,
      message: "Feedback sent. Thank you!",
    };
  } catch (error) {
    captureError(error, {
      area: "betaFeedback",
      payload,
    });

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Could not send feedback.",
    };
  }
}
