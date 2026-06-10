
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore, firebaseConfigured, firebaseAuth } from "./firebase";

export async function uploadCloudSave(progress: any) {
  if (!firebaseConfigured() || !firebaseAuth.currentUser) {
    return { success: false, message: "User not signed in." };
  }

  await setDoc(
    doc(firestore, "cloudSaves", firebaseAuth.currentUser.uid),
    {
      progress,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
      version: 1,
    },
    { merge: true }
  );

  return { success: true };
}

export async function downloadCloudSave() {
  if (!firebaseConfigured() || !firebaseAuth.currentUser) {
    return { success: false, save: null };
  }

  const snapshot = await getDoc(
    doc(firestore, "cloudSaves", firebaseAuth.currentUser.uid)
  );

  if (!snapshot.exists()) {
    return { success: false, save: null };
  }

  return {
    success: true,
    save: snapshot.data(),
  };
}
