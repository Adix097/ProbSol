import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRoadmaps, goalLabel } from '../services/api';

export default function DashboardPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyRoadmaps()
      .then((d) => !cancelled && setItems(d))
      .catch((e) => !cancelled && setError(e.message || 'Could not load your roadmaps.'));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <section id="roadmaps" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-bold">My roadmaps</h2>
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        {!items && !error && <p className="mt-4 text-ink/60">Loading…</p>}
        {items?.length === 0 && (
          <p className="mt-4 text-ink/70">No roadmaps yet. <Link to="/" className="font-medium text-brand underline">Create your first one</Link>.</p>
        )}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {items?.map((r) => (
            <li key={r.id}>
              <Link to={r.status === 'ready' ? `/roadmaps/${r.id}` : `/roadmaps/${r.id}/generating`}
                    className="block rounded-lg border border-ink/10 bg-white p-5 hover:border-brand">
                <span className="text-sm text-ink/60">{goalLabel(r.goal)}</span>
                <span className="mt-1 block text-lg font-bold">{r.topic}</span>
                {r.status === 'ready' ? (
                  <>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full bg-brand" style={{ width: `${r.percent_complete}%` }} />
                    </div>
                    <span className="mt-2 block text-sm text-ink/70">{r.percent_complete}% complete · {r.completed_nodes} of {r.total_nodes} steps</span>
                  </>
                ) : (
                  <span className="mt-4 block text-sm text-ink/70">{r.status === 'failed' ? 'Generation failed. Open to retry.' : 'Still generating…'}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
