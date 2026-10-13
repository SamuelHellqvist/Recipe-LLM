import { signOut } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserData } from "../services/api"

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
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        // User is signed out - redirect to home with clean state
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        // Get user document from Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        console.log(userRef)
        console.log(currentUser.uid)

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ ...data, uid: userDoc.id });
          console.log("✅ Welcome! User data loaded from Firestore:", data);
        } else {
          // This shouldn't happen, but handle it gracefully
          console.warn("⚠️ User not found in Firestore collection");
          // navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        // setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
      {userData && (
        <div className="auth-container mb-8">
          <h1>Welcome 🎉, {userData.displayName || userData.email?.split('@')[0]}</h1>

          <p className="user-email">
            {auth.currentUser?.email}
          </p>

          {/* <button onClick={() => signOut(auth)}>
            Logout
          </button> */}

          <div className="home-navigation">
            <Link to="/recipes" className="home-nav-btn recipes-btn">
              Explore Recipes
              <span>→</span>
            </Link>

            <Link to="/favorites" className="home-nav-btn favorites-btn">
              My Favorites
            </Link>

            <Link to="/cook" className="home-nav-btn cook-btn">
              Cook
            </Link>

            <Link to="/brainstorm" className="home-nav-btn recipes-btn">
              Brainstorm
              <span>→</span>
            </Link>

          </div>



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
                    <p className="text-sm text-slate-300 mt-2">
                      <span className="font-semibold">Role:</span> {userData.role || "User"}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Member since: {new Date(userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt).toLocaleDateString()}
                    </p>
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

              {/* Row 2: Square */}
              <div className="col-span-full md:col-span-2 
                 aspect-ratio-2/1 bg-slate-800 rounded-xl p-4">
                <h3 className="text-2xl font-bold mb-3 text-purple-400">🎨 Beautiful Design</h3>
                <p className="text-slate-400 leading-relaxed">
                  Clean, modern aesthetics powered by TailwindCSS utilities.
                </p>

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
          {userData && userData.preferences && (
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
          )}
        </div>
      )}
    </div>
  );
}