
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import type { User } from "firebase/auth";
import { db } from "./firebase";

export async function ensureUserProfile(user: User) {
  const userRef = doc(db, "users", user.uid);

  // Check if the user already exists
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return;
  }

  // Create a new user profile
  await setDoc(userRef, {
    profile: {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? ""
    },

    settings: {
      theme: "system"
    },

    timestamps: {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    }
  });

  console.log("User profile created in Firestore");
}
