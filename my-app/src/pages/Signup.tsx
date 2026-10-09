import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useState } from "react";
import { Link } from "react-router-dom";

import "../App.css"

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signup = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  return (
    <div className="auth-container centered bg-slate-900 text-white">
      <h2>Create Account</h2>

      <input
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={signup}>Sign Up</button>

      <p>
        <Link to="/login">Already have an account?</Link>
      </p>
    </div>
  );
}