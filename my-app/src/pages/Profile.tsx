import { useState } from 'react';
import { updateProfile, signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { PageHeading, Panel, Icon } from '../components/UI';
export default function Profile() {
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function save() {
    if (!user) return;
    setBusy(true); setError(''); setSaved(false);
    try { await updateProfile(user, { displayName: name.trim() }); setSaved(true); }
    catch { setError('Your changes could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main><PageHeading eyebrow="A kitchen that feels like you" title="Your profile">The little details that make this space yours.</PageHeading><div className="grid items-start gap-5 md:grid-cols-3"><Panel><div className="mb-5 grid size-20 place-items-center overflow-hidden rounded-full bg-sage">{user?.photoURL ? <img src={user.photoURL} alt="Your profile" className="size-full object-cover"/> : <Icon name="user" className="size-9"/>}</div><h2>{user?.displayName || 'Home cook'}</h2><p className="mt-2 break-all text-sm text-muted">{user?.email}</p><button className="btn-secondary mt-6" onClick={() => { void signOut(auth).catch(() => setError('Could not sign out. Please try again.')); }}>Sign out</button></Panel><Panel className="md:col-span-2"><h2 className="mb-6">Personal details</h2><form className="space-y-5" onSubmit={e => {e.preventDefault(); void save();}}><div><label htmlFor="display-name" className="mb-2 block text-sm font-medium">Display name</label><input id="display-name" autoComplete="name" maxLength={80} value={name} onChange={e => {setName(e.target.value); setSaved(false);}} required/></div><p className="text-sm text-muted">This is how we’ll welcome you to your kitchen.</p><div className="flex flex-wrap gap-3"><button className="btn" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Save changes'}</button><Link to="/" className="btn-secondary">Cancel</Link></div>{saved && <p role="status" className="text-brand">Your profile is updated.</p>}{error && <p role="alert">{error}</p>}</form></Panel></div></main>;
}
