import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { ensureUserProfile } from '../services/users';
import { Icon } from './UI';
export default function AuthScreen({ signup = false }: { signup?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function authenticate(google: boolean) {
    setBusy(true); setError('');
    try {
      const result = google ? await signInWithPopup(auth, googleProvider) : await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(result.user);
    } catch { setError('We couldn’t sign you in. Check your details or try Google again.'); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void authenticate(false); }
  return <main className="mx-auto grid max-w-5xl gap-5 py-2 md:grid-cols-2 md:py-8">
    <section className="relative flex flex-col justify-between overflow-hidden rounded-card bg-sage p-7 md:min-h-[550px] md:p-10">
      <div><p className="eyebrow">Good food. Good company.</p><h1 className="mt-6 text-5xl md:text-6xl">Super charge your cooking.</h1><p className="mt-5 max-w-xs text-muted">Did you miss AI in the kitchen?</p> <p>Look no further than <b>tAible.</b></p></div>
      <div aria-hidden="true" className="my-8 hidden items-center justify-center md:flex"><div className="grid size-48 place-items-center rounded-full border-[16px] border-surface/80 bg-linen shadow-card"><Icon name="cook" className="size-20 text-brand" /></div></div>
      <div className="mt-8 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-surface/70 px-3 py-2">Made for home cooks</span><span className="rounded-full bg-surface/70 px-3 py-2">Inspired by you</span></div>
    </section>
    <section className="panel flex flex-col justify-center md:p-10"><p className="eyebrow mb-3">Your place at the table</p><h2 className="font-display text-3xl font-normal">{signup ? 'Make yourself at home.' : 'Welcome back.'}</h2><p className="mt-3 mb-7 text-sm text-muted">{signup ? 'Create your account with Google to start your recipe collection.' : 'Sign in and pick up where you left off.'}</p>
      {error && <p role="alert" className="mb-5 rounded-xl bg-clay p-4 text-sm">{error}</p>}
      {!signup && <form onSubmit={submit} className="space-y-4"><div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div><div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} /></div><button disabled={busy} className="btn w-full">{busy ? 'Signing in…' : 'Sign in'}<Icon name="arrow" /></button></form>}
      {!signup && <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or continue with<span className="h-px flex-1 bg-line" /></div>}
      <button className="btn-secondary w-full" disabled={busy} onClick={() => void authenticate(true)}><span aria-hidden="true" className="text-lg font-bold">G</span>{busy ? 'Connecting…' : 'Continue with Google'}</button>
      <p className="mt-7 text-center text-sm text-muted">{signup ? 'Already have an account? ' : 'New to little table? '}<Link className="font-semibold text-brand underline underline-offset-4" to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Join the table'}</Link></p>
    </section>
  </main>;
}
