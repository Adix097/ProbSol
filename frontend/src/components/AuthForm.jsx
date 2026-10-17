import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { useAuth } from '../services/auth';
import { createRoadmap, roadmapPath } from '../services/api';

// Shared by LoginPage and SignupPage. After success, resumes any saved
// "create roadmap" intent from the home form, otherwise returns to the previous page.
export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (isSignup) await signup(f.name.trim(), f.email.trim(), f.password);
      else await login(f.email.trim(), f.password);
      const intent = JSON.parse(localStorage.getItem('probsol_intent') || 'null');
      if (intent) {
        localStorage.removeItem('probsol_intent');
        navigate(roadmapPath(await createRoadmap(intent)), { replace: true });
      } else navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  const input = 'mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-3 py-2 focus:border-brand focus:bg-white';
  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
      <div className="hidden lg:block">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-dark"><Sparkles className="h-4 w-4" /> Learn with intention</span>
        <h1 className="mt-5 text-4xl font-bold leading-tight">Your next breakthrough starts with one small step.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/65">Save your roadmaps, collect completion badges, and build a learning record you can be proud of.</p>
      </div>
      <div>
      <h1 className="text-2xl font-bold">{isSignup ? 'Create your account' : 'Log in'}</h1>
      <form onSubmit={onSubmit} className="surface-glass mt-6 space-y-4 rounded-3xl p-6">
        {isSignup && (
          <label className="block text-sm font-medium">Name
            <input required value={f.name} onChange={set('name')} autoComplete="name" className={input} />
          </label>
        )}
        <label className="block text-sm font-medium">Email
          <input required type="email" value={f.email} onChange={set('email')} autoComplete="email" className={input} />
        </label>
        <label className="block text-sm font-medium">Password
          <input required type="password" minLength={6} value={f.password} onChange={set('password')}
                 autoComplete={isSignup ? 'new-password' : 'current-password'} className={input} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark disabled:opacity-60">
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/70">
        {isSignup ? 'Already have an account? ' : 'New here? '}
        <Link to={isSignup ? '/login' : '/signup'} state={{ from }} className="font-medium text-brand underline">
          {isSignup ? 'Log in' : 'Create an account'}
        </Link>
      </p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink/50"><LockKeyhole className="h-3.5 w-3.5" /> Your learning data stays private.</p>
      </div>
    </div>
  );
}
