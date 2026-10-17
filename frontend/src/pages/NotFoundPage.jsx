import { Link } from 'react-router-dom';
import { Compass, Home, Sparkles } from 'lucide-react';
export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28">
      <div className="surface-glass rounded-[2rem] p-8 sm:p-12">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-white shadow-lg shadow-brand/20"><Compass className="h-10 w-10 animate-float-gently" aria-hidden /></div>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[.2em] text-brand"><Sparkles className="h-4 w-4" /> Lost your way?</div>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink/70">That address doesn't lead anywhere.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"><Home className="h-4 w-4" /> Back to home</Link>
      </div>
    </div>
  );
}
