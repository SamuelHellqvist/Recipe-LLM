import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import { useEffect, useState } from 'react';

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from './services/firebase';

import './App.css'
import Old from './pages/Old'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'


function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // or remove type entirely if you want to let TS infer

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <BrowserRouter>
        <Routes> 
          {/* === TODO === */}
          {/* Make the landing page the default route when not authenticated */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/old" element={<Old />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  )

}

export default App;