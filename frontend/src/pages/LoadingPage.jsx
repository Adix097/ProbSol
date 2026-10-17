import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Compass, Loader2, Sparkles } from 'lucide-react';
import { createRoadmap, getRoadmap, roadmapPath } from '../services/api';

const MESSAGES = [
  'Mapping out the stages…',
  'Ordering topics from basics to advanced…',
  'Finding videos, articles and docs for each step…',
  'Adding hands-on projects…',
  'Almost there. New topics can take 1–2 minutes.',
];
const POLL_MS = 4000;

export default function LoadingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rm, setRm] = useState(null);
  const [failed, setFailed] = useState('');
  const [msg, setMsg] = useState(0);
  const [attempt, setAttempt] = useState(0); // bump to restart polling

  // Poll every few seconds. The cleanup stops polling the moment the user leaves.
  useEffect(() => {
    let cancelled = false;
    let timer;
    const poll = async () => {
      try {
        const data = await getRoadmap(id);
        if (cancelled) return;
        setRm(data);
        if (data.status === 'ready') return navigate(`/roadmaps/${id}`, { replace: true });
        if (data.status === 'failed') return setFailed(data.error || 'Generation failed.');
      } catch (err) {
        if (!cancelled) setFailed(err.message || 'Could not check progress.');
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id, attempt, navigate]);

  useEffect(() => {
    const t = setInterval(() => setMsg((m) => Math.min(m + 1, MESSAGES.length - 1)), 7000);
    return () => clearInterval(t);
  }, []);

  async function retry() {
    setFailed('');
    try {
      if (rm?.topic) {
        const res = await createRoadmap({ topic: rm.topic, goal: rm.goal });
        if (res.id !== id) return navigate(roadmapPath(res), { replace: true });
      }
      setAttempt((a) => a + 1);
    } catch (err) { setFailed(err.message); }
  }

  if (failed) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-700" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">We couldn't build this roadmap</h1>
        <p role="alert" className="mt-2 text-ink/70">{failed}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={retry} className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">Retry</button>
          <Link to="/" className="rounded-md border border-ink/20 px-4 py-2 font-medium hover:bg-ink/5">Change topic</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24" role="status" aria-live="polite">
      <div className="surface-glass relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/60 blur-2xl" />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft text-brand shadow-inner"><Compass className="h-10 w-10 animate-float-gently" aria-hidden /></div>
        <div className="mx-auto mt-8 flex max-w-xs items-center justify-between"><span className="h-2 w-2 rounded-full bg-brand" /><span className="h-2 w-2 rounded-full bg-emerald-300" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-fuchsia-300" /></div>
        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Building your roadmap</h1>
        <p className="mt-2 break-words text-lg text-brand-dark">{rm?.topic || 'Your personalized learning path'}</p>
        <p className="mt-4 text-ink/70">{MESSAGES[msg]}</p>
        <div className="mx-auto mt-7 flex max-w-sm items-center gap-3 rounded-full bg-brand-soft/60 px-4 py-3 text-left text-sm text-brand-dark"><Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /><span>{rm?.status === 'generating' ? 'Generating stages and resources' : 'Queued for generation'}</span><Sparkles className="ml-auto h-4 w-4 shrink-0" aria-hidden /></div>
        <div className="mt-6 flex justify-center gap-5 text-xs text-ink/50"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Curated topics</span><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Hands-on projects</span></div>
      </div>
    </div>
  );
}
