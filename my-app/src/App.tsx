
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { useEffect, useState } from "react";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./services/firebase";
import { ensureUserProfile } from "./services/users";

import "./App.css";

import Old from "./pages/Old";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RecipesPage from "./pages/RecipesPage";
import FavoritesPage from "./pages/FavoritesPage";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {

    // Listen for Firebase authentication changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          console.log("User authenticated:", currentUser.email);
          console.log("Firebase UID:", currentUser.uid);

          // Create Firestore profile if missing
          ensureUserProfile(currentUser)
            .then(() => {
              console.log("Firestore user profile verified");
            })
            .catch((error) => {
              console.error(
                "Failed to create Firestore profile:",
                error
              );
            });

        } else {
          console.log("No user logged in");
        }
      }
    );

    // Clean up authentication listener
    return () => unsubscribe();

  }, []);

  // Wait until Firebase checks authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={
            !user
              ? <Login />
              : <Navigate to="/" replace />
          }
        />

        {/* Home */}
        <Route
          path="/"
          element={
            user
              ? <Home />
              : <Navigate to="/login" replace />
          }
        />

        {/* Old page */}
        <Route
          path="/old"
          element={<Old />}
        />

        {/* Recipes */}
        <Route
          path="/recipes"
          element={
            user
              ? <RecipesPage />
              : <Navigate to="/login" replace />
          }
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={
            !user
              ? <Signup />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="/favorites"
          element={
            user ? <FavoritesPage /> : <Navigate to="/login" replace />
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? "/" : "/login"}
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
