import { PageHeading, Panel } from "../components/UI";
'import React from "react";' 

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'



import '../App.css'

interface User {
  id: string;
  [key: string]: unknown;
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

  return <main><PageHeading eyebrow="Development tools" title="Kitchen diagnostics">Connection status and stored user records.</PageHeading><Panel><button className="btn-secondary" onClick={() => setCount(count + 1)}>Interaction count: {count}</button></Panel><section className="mt-5 space-y-4"><h2>User data</h2>{loading ? <p role="status">Loading…</p> : error ? <Panel><p role="alert">{error}</p><button className="btn mt-4" onClick={fetchUsersFromFirebase}>Retry</button></Panel> : userDbData.length === 0 ? <Panel>No users found.</Panel> : <div className="grid gap-4 md:grid-cols-2">{userDbData.map(user => <Panel key={user.id}><h3 className="break-all">{user.id}</h3><pre className="mt-4 overflow-auto rounded-xl bg-linen p-4 text-xs">{JSON.stringify(user, null, 2)}</pre></Panel>)}</div>}</section></main>;
}
