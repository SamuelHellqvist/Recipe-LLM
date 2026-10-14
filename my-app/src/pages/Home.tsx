import { signOut } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserData } from "../services/api"
import {
  getSubstitutionList,
  saveSubstitutionList,
} from "../services/substitutions";

async function fetchTest() {
  let uid = "XtFiQeeOUgXGcoNUU3ER";
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    console.log('User found:', userDoc.data());
    return userDoc.data();
  } else {
    console.log('No such document!');
  }
}

export default function Home() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<string[]>([]);
  const [substitutionsLoading, setSubstitutionsLoading] = useState(false);
  const [savingSubstitutions, setSavingSubstitutions] = useState(false);
  const [substitutionError, setSubstitutionError] = useState("");
  const navigate = useNavigate();

  const updateSubstitutions = async (items: string[]) => {
    if (!currentUserId || savingSubstitutions) return;

    setSavingSubstitutions(true);
    setSubstitutionError("");

    try {
      await saveSubstitutionList(currentUserId, items);
      setSubstitutions(items);
    } catch (error) {
      console.error("Error saving substitution list:", error);
      setSubstitutionError("Could not save your substitution list. Please try again.");
    } finally {
      setSavingSubstitutions(false);
    }
  };

  const addItem = (item: string) => {
    const trimmedItem = item.trim();
    if (trimmedItem && !substitutions.includes(trimmedItem)) {
      void updateSubstitutions([...substitutions, trimmedItem]);
    }
  };

  const removeItem = (indexToRemove: number) => {
    void updateSubstitutions(
      substitutions.filter((_, index) => index !== indexToRemove)
    );
  };

  const clearAll = () => {
    if (window.confirm("Remove all items from your substitution list?")) {
      void updateSubstitutions([]);
    }
  };

  useEffect(() => {
    let active = true;
    let authRequest = 0;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      const thisRequest = ++authRequest;
      if (!currentUser) {
        setUserData(null);
        setCurrentUserId(null);
        setSubstitutions([]);
        setSubstitutionsLoading(false);
        setSubstitutionError("");
        setLoading(false);
        return;
      }

      setCurrentUserId(currentUser.uid);
      setSubstitutions([]);
      setSubstitutionsLoading(true);
      setSubstitutionError("");
      setLoading(true);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!active || thisRequest !== authRequest) return;

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ ...data, uid: userDoc.id });
          console.log("✅ Welcome! User data loaded from Firestore:", data);
        } else {
          setUserData(null);
          console.warn("⚠️ User not found in Firestore collection");
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }

      try {
        let savedSubstitutions = await getSubstitutionList(currentUser.uid);

        if (savedSubstitutions === null) {
          const legacyValue = localStorage.getItem("substitutionList");

          if (legacyValue === null) {
            savedSubstitutions = [];
          } else {
            const parsedValue: unknown = JSON.parse(legacyValue);
            if (
              !Array.isArray(parsedValue) ||
              !parsedValue.every((item) => typeof item === "string")
            ) {
              throw new Error("Saved browser substitution list is invalid.");
            }

            savedSubstitutions = parsedValue;
          }

          await saveSubstitutionList(currentUser.uid, savedSubstitutions);
          localStorage.removeItem("substitutionList");
        }

        if (active && thisRequest === authRequest) {
          setSubstitutions(savedSubstitutions);
        }
      } catch (err) {
        console.error("Error loading substitution list:", err);
        if (active && thisRequest === authRequest) {
          setSubstitutionError("Could not load your substitution list.");
        }
      } finally {
        if (active && thisRequest === authRequest) {
          setSubstitutionsLoading(false);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      ++authRequest;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      console.log("✅ Logged out successfully");

      // Clear user data state
      setUserData(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleTest = async () => {
    try {
      await getUserData("6dLNfB7tjEbAP31KG5tB7GzvHhU2"); // only works for your own uid, db rules
    } catch (err) {
      console.error("Error getUserData:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* User Info Header */}
      {/* {userData && ()} */}
      {/* Bento Grid Layout - Mobile Optimized */}
      <section className="container px-4 py-4">
        {/* <h2 className="text-4xl font-bold mb-12 text-center">Welcome to Our App</h2> */}
        <div className="grid 
              grid-cols-2 /* Mobile: 2 columns */
              md:grid-cols-2 /* Medium screens: 2 columns */
              lg:grid-cols-2 /* Large screens: 2 columns */
              gap-4 
              grid-flow-dense">
          {/* Row 1: Vertical tall card on left, square on right */}
          <div className="aspect-ratio-4/3 row-span-2 bg-slate-800 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-3 text-blue-400">Vertical rectangle card</h3>
            {userData && (
              <>
                <h1>Welcome 🎉</h1>

                <h2 className="">
                  {userData.displayName}
                </h2>
                
                <p className="text-sm text-slate-300 mt-2">
                  <span className="font-semibold">Role:</span> {userData.role || "User"}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Member since: {new Date(userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt).toLocaleDateString()}
                </p>

                {/* <p className="text-xs">
                  {userData.email}
                </p> */}

                {/* <button onClick={() => signOut(auth)}>
                    Logout
                  </button> */}

                <button onClick={() => navigate("/recipes")} className="bg-cyan-500 mb-1 p-1.5 rounded-md">
                  Explore Recipes
                  <span>→</span>
                </button>

                <button onClick={() => navigate("/favorites")} className="bg-cyan-500 mb-1 p-1.5 rounded-md">
                  My Favorites
                  <span>→</span>
                </button>
                
                <button onClick={() => navigate("/brainstorm")} className="bg-cyan-500 mb-1 p-1.5 rounded-md">
                  Brainstorm
                  <span>→</span>
                </button>

                <button onClick={() => navigate("/cook")} className="bg-cyan-500 mb-1 p-1.5 rounded-md">
                  Cook
                  <span>→</span>
                </button>




              </>
            )}
          </div>

          {/* Row 1: Square on right */}
          <div className="aspect-square bg-slate-800 rounded-xl p-4">
            <h3 className="text-2xl font-bold mb-3 text-green-400">🔒 Secure & Safe</h3>
            <p className="text-slate-400 leading-relaxed">
              Built with security best practices and industry-standard protection.
            </p>
          </div>
          {/* Row 1: Square on right */}
          <div className="aspect-square bg-slate-800 rounded-xl p-4">
            <h3 className="text-2xl font-bold mb-3 text-green-400">🔒 Secure & Safe</h3>
            <p className="text-slate-400 leading-relaxed">
              Built with security best practices and industry-standard protection.
            </p>
          </div>

          {/* Row 2: Substitution List */}
          <div className="col-span-full md:col-span-2 
                 aspect-ratio-2/1 bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-purple-400">Substitution list</h3>
              {substitutions.length > 0 && (
                <button 
                  onClick={clearAll}
                  disabled={savingSubstitutions || substitutionsLoading}
                  className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {substitutionsLoading && (
              <p className="text-slate-400 text-sm mb-3">
                Loading your saved substitution list...
              </p>
            )}
            {savingSubstitutions && (
              <p className="text-slate-400 text-sm mb-3">
                Saving substitution list...
              </p>
            )}
            {substitutionError && (
              <p className="text-red-400 text-sm mb-3" role="alert">
                {substitutionError}
              </p>
            )}
            
            {/* Input Field */}
            {userData && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Add a food item (e.g., 'chicken', 'milk')..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={50}
                  disabled={substitutionsLoading || savingSubstitutions}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            )}

            {/* Items List */}
            <ul className="space-y-2">
              {substitutions.map((item, index) => (
                <li 
                  key={index} 
                  className="flex items-center justify-between bg-slate-700/50 border border-slate-600/50 rounded-lg p-3 group hover:border-purple-500/30 transition-all duration-200"
                >
                  <span className="text-white flex-1 truncate pr-2">
                    {item}
                  </span>
                  <button
                    onClick={() => removeItem(index)}
                    disabled={savingSubstitutions || substitutionsLoading}
                    className="w-7 h-7 flex items-center justify-center bg-slate-600 hover:bg-red-500 rounded-full text-slate-300 hover:text-white transition-all duration-200 opacity-70 group-hover:opacity-100"
                    aria-label={`Remove ${item}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Empty State */}
            {substitutions.length === 0 && (
              <p className="text-slate-400 text-center text-sm mt-2">
                No items added yet. Type above to add your first substitution!
              </p>
            )}
          </div>


        </div>
      </section>
      <button
        onClick={handleTest}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Fetch Test
      </button>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Logout
      </button>

      {/* User Preferences (if available) */}
      {/* {userData && userData.preferences && (
            <section className="container px-4 py-4">
              <div className="bg-slate-800 rounded-xl p-6 mb-4">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Your Preferences</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Theme:</span>
                    <span className="ml-2">{userData.preferences.theme || "light"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Notifications:</span>
                    <span className="ml-2">{userData.preferences.notifications ? "On" : "Off"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Language:</span>
                    <span className="ml-2">{userData.preferences.language || "en"}</span>
                  </div>
                </div>
              </div>
            </section>
          )} */}


    </div>
  );
}
