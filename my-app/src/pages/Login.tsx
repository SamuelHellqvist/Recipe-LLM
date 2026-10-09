import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ensureUserProfile } from "../services/users";

import "../App.css"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Add error state
  const [error, setError] = useState<string | null>(null);

const login = async () => {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create the Firestore profile if missing
    await ensureUserProfile(result.user);

    setError(null);

  } catch (err: unknown) {
    console.error("Login/profile error:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Login failed"
    );
  }
};


const googleLogin = async () => {
  try {
    const result = await signInWithPopup(
      auth,
      googleProvider
    );

    // Create the Firestore profile if missing
    await ensureUserProfile(result.user);

    setError(null);

  } catch (err: unknown) {
    console.error("Google login/profile error:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Google login failed"
    );
  }
};

  // Add onSubmit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    await login();
  };

  return (
    <div className="auth-container centered bg-slate-900 text-white">
      {/* Display error */}
      {error && <p className="error">{error}</p>}
      
      <h2>Login</h2>

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        aria-label="Email address"
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        aria-label="Password"
      />

      {/* Add form wrapper with submit handler */}
      <form onSubmit={handleSubmit}>
        <button 
          type="submit" 
          disabled={!email || !password}
        >Login</button>
      </form>

      <div className="divider">OR</div>

      <button 
        type="button" 
        className="google-btn" 
        onClick={googleLogin}
      >
        Sign in with Google
      </button>

      <p>
        <Link to="/signup">Create new account</Link>
      </p>
    </div>
  );
}