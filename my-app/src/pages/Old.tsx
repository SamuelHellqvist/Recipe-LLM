'import React from "react";' 

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'



import heroImg from '../assets/hero.png'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import '../App.css'

interface User {
  id: string;
  [key: string]: any;
}

export default function Old() {
  const [count, setCount] = useState(0);
  const [userDbData, setUserDbData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try multiple approaches to fetch data
  async function fetchUsersFromFirebase() {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting Firestore fetch...');

      // Method 1: Direct getDocs from 'users' collection
      const snapshot = await getDocs(collection(db, 'users'));
      const userData: User[] = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));

      console.log(`✅ Found ${userData.length} users`);
      setUserDbData(userData);

    } catch (err) {
      console.error('❌ Error fetching users:', err);
      
      // Check if it's a permission error
      if (err instanceof Error && (err.message.includes('permission') || err.message.includes('access'))) {
        setError('Firestore security rules prevent read access. Check Firestore Rules.');
        setUserDbData([]);
      } else {
        setError('Failed to connect to Firebase Firestore. Check your connection.');
        setUserDbData([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsersFromFirebase();
  }, []);

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        

        {/* Display a code block with the .json content of the database here */}




      </section>

      <div className="ticks"></div>

      {/* Render user data directly with proper React components */}
      <section id="users">
        <h2>User Data</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : userDbData.length === 0 && !error ? (
          <div className="no-data">
            <p>No users found in Firestore.</p>
            <p>Check the browser console for details.</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <h3>Error: {error}</h3>
            <button onClick={fetchUsersFromFirebase}>Retry</button>
          </div>
        ) : userDbData.length > 0 ? (
          <div className="user-list">
            {userDbData.map((user) => (
              <div key={user.id} className="user-card">
                <h3>User: {user.id}</h3>
                {/* Render available fields */}
                {Object.entries(user).map(([key, value]) => 
                  typeof value === 'object' && value !== null ? (
                    <pre key={key}>{JSON.stringify(value, null, 2)}</pre>
                  ) : (
                    <p key={key}><strong>{key}:</strong> {value}</p>
                  )
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section> */}

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )



}




'' 
