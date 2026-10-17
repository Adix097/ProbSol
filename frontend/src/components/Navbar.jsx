import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Compass, LogOut } from 'lucide-react';
import { useAuth } from '../services/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-soft text-brand-dark' : 'text-ink/70 hover:bg-white/70 hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-20 border-b border-white/80 bg-[#eef4f0]/85 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-2 flex items-center gap-2 text-lg font-bold tracking-tight sm:mr-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
            <Compass className="h-4 w-4" aria-hidden />
          </span>
          <span>ProbSol</span>
        </Link>
        <NavLink to="/" end className={link}>Home</NavLink>
        {user && (
          <>
            <NavLink to="/dashboard" end className={link}>Dashboard</NavLink>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-ink/60 sm:inline">{user.name}</span>
              <button onClick={() => { logout(); navigate('/'); }} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/60 px-3 py-1.5 text-sm font-medium transition hover:bg-white">
                <LogOut className="h-3.5 w-3.5" aria-hidden /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-ink/70 hover:text-ink">Log in</Link>
              <Link to="/signup" className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
