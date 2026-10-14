import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

function getSubstitutionsRef(userId: string) {
  return doc(
    db,
    "users",
    userId,
    "preferences",
    "substitutions"
  );
}

export async function getSubstitutionList(
  userId: string
): Promise<string[] | null> {
  const snapshot = await getDoc(getSubstitutionsRef(userId));

  if (!snapshot.exists()) {
    return null;
  }

  const items: unknown = snapshot.data().items;

  if (!Array.isArray(items) || !items.every((item) => typeof item === "string")) {
    throw new Error("Saved substitution list has an invalid format.");
  }

  return items;
}

export async function saveSubstitutionList(
  userId: string,
  items: string[]
): Promise<void> {
  await setDoc(getSubstitutionsRef(userId), {
    items,
    updatedAt: serverTimestamp(),
  });
}
