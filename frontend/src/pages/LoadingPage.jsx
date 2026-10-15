import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
    <div className="mx-auto max-w-md px-4 py-24 text-center" role="status" aria-live="polite">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" aria-hidden />
      <h1 className="mt-6 text-2xl font-bold">Building your roadmap{rm?.topic ? `: ${rm.topic}` : ''}</h1>
      <p className="mt-3 text-ink/70">{MESSAGES[msg]}</p>
      <p className="mt-1 text-sm text-ink/50">{rm?.status === 'generating' ? 'Generating' : 'Queued'}</p>
    </div>
  );
}
