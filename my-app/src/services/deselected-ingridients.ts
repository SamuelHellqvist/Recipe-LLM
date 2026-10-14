import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import type { Ingredient } from "../types/food";

// Get current logged-in user
function getUserId(): string {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return user.uid;
}

// Generate a safe document ID from ingredient name
function getIngredientId(
  ingredient: Ingredient
): string {
  const ingredientName = ingredient.namn ?? "";

  return ingredientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET ALL DESELECTED INGREDIENTS
export async function getDeselectedIngredients(): Promise<
  Ingredient[]
> {
  const userId = getUserId();

  const ingredientsRef = collection(
    db,
    "users",
    userId,
    "deselectedIngredients"
  );

  const snapshot = await getDocs(ingredientsRef);

  return snapshot.docs.map(
    (document) => document.data() as Ingredient
  );
}

// SAVE DESELECTED INGREDIENT
export async function saveDeselectedIngredient(
  ingredient: Ingredient
) {
  const userId = getUserId();

  const ingredientRef = doc(
    db,
    "users",
    userId,
    "deselectedIngredients",
    getIngredientId(ingredient)
  );

  await setDoc(ingredientRef, {
    nummer: ingredient.nummer,
    namn: ingredient.namn,
    savedAt: serverTimestamp(),
  });

  console.log(
    "Saved deselected ingredient:",
    ingredientRef.path
  );
}

// REMOVE DESELECTED INGREDIENT
export async function removeDeselectedIngredient(
  ingredient: Ingredient
) {
  const userId = getUserId();

  const ingredientRef = doc(
    db,
    "users",
    userId,
    "deselectedIngredients",
    getIngredientId(ingredient)
  );

  await deleteDoc(ingredientRef);
}

// CHECK IF INGREDIENT IS DESELECTED
export async function isDeselectedIngredient(
  ingredient: Ingredient
): Promise<boolean> {
  const userId = getUserId();

  const ingredientRef = doc(
    db,
    "users",
    userId,
    "deselectedIngredients",
    getIngredientId(ingredient)
  );

  const snapshot = await getDoc(ingredientRef);

  return snapshot.exists();
}