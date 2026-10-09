// this file to save recipes to Firestore.

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
import type { Dish, Food } from "../types/food";

// Get the current logged-in user
function getUserId(): string {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return user.uid;
}



function getFavoriteId(dish: Food): string {
  return dish.namn
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


//  GET ALL USER FAVORITES
export async function getFavorites(): Promise<Dish[]> {
  const userId = getUserId();

  const favoritesRef = collection(
    db,
    "users",
    userId,
    "favorites"
  );

  const snapshot = await getDocs(favoritesRef);

  return snapshot.docs.map(
    (document) => document.data() as Dish
  );
}


export async function saveFavorite(dish: Dish) {
  const userId = getUserId();

  const favoriteRef = doc(
    db,
    "users",
    userId,
    "favorites",
    getFavoriteId(dish)
  );

  await setDoc(favoriteRef, {
    nummer: dish.nummer,
    namn: dish.namn,

    ingredients: dish.ingredients.map((ingredient) => ({
      nummer: ingredient.nummer,
      namn: ingredient.namn,
      viktForeTillagning:
        ingredient.viktForeTillagning ?? null,
      viktEfterTillagning:
        ingredient.viktEfterTillagning ?? null,
      tillagningsfaktor:
        ingredient.tillagningsfaktor ?? null,
    })),

    savedAt: serverTimestamp(),
  });

  console.log("Saved favorite:", favoriteRef.path);
}


// REMOVE FAVORITE

export async function removeFavorite(dish: Food) {
  const userId = getUserId();

  const nameRef = doc(
    db,
    "users",
    userId,
    "favorites",
    getFavoriteId(dish)
  );

  const numberRef = doc(
    db,
    "users",
    userId,
    "favorites",
    String(dish.nummer)
  );

  await Promise.all([
    deleteDoc(nameRef),
    deleteDoc(numberRef)
  ]);
}



// CHECK IF RECIPE IS FAVORITE

export async function isFavorite(
  dish: Food
): Promise<boolean> {
  const userId = getUserId();

  // New document ID using recipe name
  const nameRef = doc(
    db,
    "users",
    userId,
    "favorites",
    getFavoriteId(dish)
  );

  // Old document ID using recipe number
  const numberRef = doc(
    db,
    "users",
    userId,
    "favorites",
    String(dish.nummer)
  );

  const [nameSnapshot, numberSnapshot] =
    await Promise.all([
      getDoc(nameRef),
      getDoc(numberRef)
    ]);

  return nameSnapshot.exists() || numberSnapshot.exists();
}


