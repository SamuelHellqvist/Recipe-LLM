import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { updateProfile, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../services/firebase';
import { Navigate } from 'react-router-dom'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
        console.log("currentUser:", auth.currentUser)
      setUser(auth.currentUser);
      setDisplayName(auth.currentUser.displayName || '');
      setPhoneNumber(auth.currentUser.phoneNumber || '');
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Update display name
      if (displayName.trim()) {
        await updateProfile(user, { displayName });
      }

    //// Upload profile picture
    //   if (profilePicture) {
    //     const storageRef = ref(
    //       auth.storage, 
    //       `profile-pictures/${user.uid}/${Date.now()}_${profilePicture.name}`
    //     );
    //    
    //     await uploadBytes(storageRef, profilePicture);
    //     const photoURL = await getDownloadURL(storageRef);
    //    
    //     await updateProfile(user, { photoURL });
    //   }

      // Update phone number (requires admin or specific permissions in Firebase)
      if (phoneNumber.trim()) {
        // Note: Phone number updates may require additional Firebase Auth configuration
        // For now, we'll store it in a custom claim or Firestore document
        console.log('Phone number updated:', phoneNumber);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
    // if "cancel" is pressed, send user back to home
    <Navigate to="/"/>;
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Profile Settings</h1>
        
        <div className="bg-slate-800 rounded-xl p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden mb-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <span className="text-sm font-medium">Upload Photo</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}