import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

  const input = 'mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 focus:border-brand';
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">{isSignup ? 'Create your account' : 'Log in'}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
        <button disabled={busy} className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/70">
        {isSignup ? 'Already have an account? ' : 'New here? '}
        <Link to={isSignup ? '/login' : '/signup'} state={{ from }} className="font-medium text-brand underline">
          {isSignup ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}
