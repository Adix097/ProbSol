import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../services/auth';
import { GOALS, createRoadmap, roadmapPath } from '../services/api';

function validateTopic(raw) {
  const t = raw.trim();
  if (t.length < 2) return 'Enter at least 2 characters.';
  if (t.length > 100) return 'Keep the topic under 100 characters.';
  return '';
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [touched, setTouched] = useState({ topic: false, goal: false });
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  const topicError = validateTopic(topic);
  const goalError = goal ? '' : 'Pick a goal.';
  const valid = !topicError && !goalError;

  async function onSubmit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    const payload = { topic: topic.trim(), goal };
    // Logged out: remember what they asked for, resume after login.
    if (!user) {
      localStorage.setItem('probsol_intent', JSON.stringify(payload));
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }
    setBusy(true); setApiError('');
    try {
      navigate(roadmapPath(await createRoadmap(payload)));
    } catch (err) {
      setApiError(err.message || 'Could not start your roadmap. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-16">
      <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">What do you want to learn?</h1>
      <p className="mt-3 max-w-lg text-lg text-ink/70">Tell us the topic and where you want to end up. We'll lay out the stages, with resources for each step.</p>

      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-8">
        <div>
          <label htmlFor="topic" className="block font-medium">Topic</label>
          <input id="topic" value={topic} maxLength={200}
                 onChange={(e) => setTopic(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, topic: true }))}
                 placeholder="e.g. Data Structures and Algorithms, Guitar, Personal Finance"
                 aria-invalid={touched.topic && !!topicError} aria-describedby="topic-err"
                 className="mt-2 w-full rounded-md border border-ink/20 bg-white px-4 py-3 text-lg focus:border-brand" />
          <p id="topic-err" className="mt-1 min-h-5 text-sm text-red-700">{touched.topic ? topicError : ''}</p>
        </div>

        <div>
          <span id="goal-label" className="block font-medium">Goal</span>
          <div role="radiogroup" aria-labelledby="goal-label" className="mt-2 grid gap-3 sm:grid-cols-3">
            {GOALS.map((g) => (
              <button key={g.value} type="button" role="radio" aria-checked={goal === g.value}
                      onClick={() => { setGoal(g.value); setTouched((t) => ({ ...t, goal: true })); }}
                      className={`rounded-lg border-2 p-4 text-left ${goal === g.value ? 'border-brand bg-brand-soft' : 'border-ink/10 bg-white hover:border-ink/30'}`}>
                <span className="block font-bold">{g.label}</span>
                <span className="mt-1 block text-sm text-ink/70">{g.blurb}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 min-h-5 text-sm text-red-700">{touched.goal ? goalError : ''}</p>
        </div>

        {apiError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}

        <button type="submit" disabled={!valid || busy}
                className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Generate roadmap
        </button>
      </form>
    </div>
  );
}
