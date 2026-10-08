import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useState } from "react";
import { Link } from "react-router-dom";

import "../App.css"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Add error state
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const googleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || "Google login failed");
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