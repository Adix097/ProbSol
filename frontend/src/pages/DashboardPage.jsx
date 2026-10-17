import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Award, BadgeCheck, BookOpen, Check, Flame, Sparkles, Trophy } from 'lucide-react';
import { getMyRoadmaps, getProgress, getRoadmap, goalLabel } from '../services/api';
import { useAuth } from '../services/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [badges, setBadges] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyRoadmaps()
      .then(async (d) => {
        if (cancelled) return;
        setItems(d);
        const ready = d.filter((item) => item.status === 'ready');
        const details = await Promise.all(ready.map(async (item) => {
          const [roadmap, progress] = await Promise.all([getRoadmap(item.id), getProgress(item.id)]);
          return { roadmap, progress };
        }));
        if (!cancelled) {
          setBadges(details.flatMap(({ roadmap, progress }) => roadmap.stages.flatMap((stage) => stage.nodes
            .filter((node) => progress.nodes?.[node.id]?.status === 'completed')
            .map((node) => ({ id: `${roadmap.id}-${node.id}`, title: node.title, topic: roadmap.topic, type: node.type })))));
        }
      })
      .catch((e) => !cancelled && setError(e.message || 'Could not load your roadmaps.'));
    return () => { cancelled = true; };
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Learner';
  const initials = displayName.slice(0, 2).toUpperCase();
  const completedRoadmaps = items?.filter((item) => item.status === 'ready' && item.percent_complete === 100).length || 0;
  const totalProgress = items?.length ? Math.round(items.reduce((sum, item) => sum + (item.percent_complete || 0), 0) / items.length) : 0;
  const badgeCount = badges.length;
  const badgeMessage = useMemo(() => badgeCount > 0 ? 'You are building a serious learning streak.' : 'Complete a course step to earn your first badge.', [badgeCount]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:pt-10">
      <div className="surface-glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-emerald-400 text-xl font-bold text-white shadow-lg shadow-brand/20">{initials}</div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-brand-dark"><Sparkles className="h-4 w-4" aria-hidden /> Your learning studio</div>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Welcome back, {displayName}</h1>
              <p className="mt-1 max-w-xl text-ink/65">{badgeMessage}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:w-52">
            <div className="rounded-2xl bg-white/70 p-3"><p className="text-xl font-bold text-brand-dark">{totalProgress}%</p><p className="text-[11px] uppercase tracking-wide text-ink/50">Average progress</p></div>
            <div className="rounded-2xl bg-white/70 p-3"><p className="text-xl font-bold text-amber-600">{badgeCount}</p><p className="text-[11px] uppercase tracking-wide text-ink/50">Badges earned</p></div>
          </div>
        </div>
      </div>
      <section aria-label="Profile achievements" className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="surface-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-xl font-bold"><Trophy className="h-5 w-5 text-amber-500" aria-hidden /> Achievement shelf</h2><p className="mt-1 text-sm text-ink/60">Every completed course step becomes part of your profile.</p></div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{badgeCount} earned</span>
          </div>
          {badges.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-brand/25 bg-brand-soft/30 p-5 text-center"><Award className="mx-auto h-8 w-8 text-brand/70" aria-hidden /><p className="mt-2 font-semibold">Your first badge is waiting</p><p className="mt-1 text-sm text-ink/60">Mark a learning step as completed to unlock it.</p></div>
          ) : (
            <div className="mt-5 grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {badges.map((badge) => <div key={badge.id} className="group flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-3 transition hover:-translate-y-1 hover:shadow-md"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm"><BadgeCheck className="h-6 w-6" aria-hidden /></span><span className="min-w-0"><strong className="block truncate text-sm">{badge.title}</strong><span className="block truncate text-xs text-ink/55">{badge.topic}</span></span></div>)}
            </div>
          )}
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-brand to-emerald-500 p-6 text-white shadow-xl shadow-brand/20">
          <Flame className="h-8 w-8 text-amber-200" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold">Keep the momentum</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">Small wins compound. Pick one step today and turn it into another badge for your profile.</p>
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4" aria-hidden /> {completedRoadmaps} roadmap{completedRoadmaps === 1 ? '' : 's'} completed</div>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-dark transition hover:-translate-y-0.5">Start a new roadmap</Link>
        </div>
      </section>
      <section id="roadmaps" className="mt-8 scroll-mt-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-brand" aria-hidden /> My roadmaps</h2>
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        {!items && !error && <p className="mt-4 text-ink/60">Loading…</p>}
        {items?.length === 0 && (
          <p className="mt-4 text-ink/70">No roadmaps yet. <Link to="/" className="font-medium text-brand underline">Create your first one</Link>.</p>
        )}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {items?.map((r) => (
            <li key={r.id}>
              <Link to={r.status === 'ready' ? `/roadmaps/${r.id}` : `/roadmaps/${r.id}/generating`}
                    className="group block rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg">
                <span className="text-sm text-ink/60">{goalLabel(r.goal)}</span>
                <span className="mt-1 flex items-start justify-between gap-3 text-lg font-bold"><span className="min-w-0 break-words">{r.topic}</span><ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-brand opacity-0 transition group-hover:opacity-100" aria-hidden /></span>
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
