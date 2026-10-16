import { 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Creates a user document in Firestore's 'users' collection when Google sign-in succeeds.
 * This is called after successful Firebase Auth login with Google.
 */
export async function createGoogleUser(googleUserCredential: any) {
  const user = googleUserCredential.user;
  
  // Check if user document already exists
  const userDocRef = doc(db, "users", user.uid);
  const userSnapShot = await getDoc(userDocRef);
  
  console.log("userDocRef:", userDocRef);
  console.log("userSnapShot:", userSnapShot);


  if (!userSnapShot.exists()) {
    // Create new user document in Firestore 'users' collection
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || null,
      provider: "google",
      createdAt: new Date().toISOString(),
      // Add any additional fields you need here
    });

    console.log("✅ Created new user document in Firestore 'users' collection");
  } else {
    console.log("ℹ️ User already exists in Firestore 'users' collection");
  }
}

/**
 * Fetches a user document from Firestore's 'users' collection by UID
 */
export async function getUserFromFirestore(uid: string) {
  const userDocRef = doc(db, "users", uid);
  return getDoc(userDocRef);
}

/** TODO
 * Updates the "lastLoginAt" variable for the current user
 */
export async function updateLastLoginAt(_uid: string){
  // 
}

export async function getUserData(uid: string) {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    console.log('User found:', userDoc.data());
    return userDoc.data();
  } else {
    console.log('No such document!');
  }
}



// export async function initializeUserSubCollections(uid: string){
//   const profileRef = doc(db, "users", uid);
  
//   const usersCollection = collection(db, "users");
//   await setDoc(doc(usersCollection, uid),{}, {merge:true});

//   // Ensure subcollections exist (Firebase AutoID will handle this)
//   const profileRef1 = doc(db, "users", uid, "profile");
//   const settingsRef = doc(db, "users", uid, "settings");
//   const timestampsRef = doc(db, "users", uid, "timestamps");

//   // Initialize with default values if they don't exist
//   await setDoc(profileRef, {
//     displayName: "",
//     email: "",
//     photoURL: null,
//     createdAt: Timestamp.now(),
//   }, { merge: false }); // No merge - full replace


// }

//livsmedelsverket API base URL
  const language = 2; // 1 = Swedish, 2 = English

const BASE_URL =
  "https://dataportal.livsmedelsverket.se/livsmedel/api/v1";

export async function getFoods() {
    const response = await fetch(
    `${BASE_URL}/livsmedel?offset=0&limit=10000&sprak=${language}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getDishes() {
  const data = await getFoods();

  return data.livsmedel.filter(
    (food: any) => food.livsmedelsTypId === 2
  );
}

export async function getIngredients(id: number) {
  const response = await fetch(
    `${BASE_URL}/livsmedel/${id}/ingredienser?sprak=${language}`
  )

  if (!response.ok) {
    console.log(`No ingredients found for ${id}`)
    return []
  }

  const data = await response.json();
  return data.value ?? data;
}
