import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-brand-soft text-brand-dark' : 'text-ink/70 hover:text-ink'}`;

  return (
    <header className="border-b border-ink/10 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 flex items-center gap-2 text-lg font-bold tracking-tight">
          <img src="/favicon.svg" alt="" className="h-5 w-5" aria-hidden="true" /> ProbSol
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
              <button onClick={() => { logout(); navigate('/'); }} className="rounded-md border border-ink/20 px-3 py-1.5 text-sm font-medium hover:bg-ink/5">Log out</button>
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
