import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Sparkles, Target, WandSparkles } from 'lucide-react';
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
  const [experience, setExperience] = useState('beginner');
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [target, setTarget] = useState('');
  const [touched, setTouched] = useState({ topic: false, goal: false });
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  const topicError = validateTopic(topic);
  const goalError = goal ? '' : 'Pick a goal.';
  const valid = !topicError && !goalError;

  async function onSubmit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    const payload = {
      topic: topic.trim(),
      goal,
      learner_profile: { experience, weekly_hours: Number(weeklyHours), target: target.trim() },
    };
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
    <div className="relative mx-auto max-w-5xl overflow-hidden px-4 pb-8 pt-12 sm:pt-16">
      <div className="pointer-events-none absolute -right-8 top-8 hidden h-28 w-28 rounded-[2rem] bg-emerald-200/50 sm:block animate-float-gently" />
      <div className="pointer-events-none absolute right-24 top-28 hidden h-10 w-10 rounded-full bg-teal-200/70 sm:block animate-float-gently [animation-delay:1s]" />
      <div className="relative mx-auto max-w-2xl">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/70 px-3 py-1.5 text-sm font-medium text-brand-dark shadow-sm">
        <Sparkles className="h-4 w-4" aria-hidden /> Learn with a plan that fits you
      </div>
      <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">What do you want to learn?</h1>
      <p className="mt-3 max-w-lg text-lg text-ink/70">Tell us the topic and where you want to end up. We'll lay out the stages, with resources for each step.</p>

      <form onSubmit={onSubmit} noValidate className="surface-glass mt-10 space-y-8 rounded-3xl p-5 sm:p-8">
        <div>
          <label htmlFor="topic" className="block font-medium">Topic</label>
          <input id="topic" value={topic} maxLength={200}
                 onChange={(e) => setTopic(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, topic: true }))}
                 placeholder="e.g. Data Structures and Algorithms, Guitar, Personal Finance"
                 aria-invalid={touched.topic && !!topicError} aria-describedby="topic-err"
                 className="mt-2 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-lg shadow-sm transition focus:border-brand focus:bg-white" />
          <p id="topic-err" className="mt-1 min-h-5 text-sm text-red-700">{touched.topic ? topicError : ''}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="experience" className="block font-medium">Current experience</label>
            <select id="experience" value={experience} onChange={(e) => setExperience(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3">
              <option value="beginner">Starting from zero</option>
              <option value="some_experience">Some experience</option>
              <option value="advanced">Already advanced</option>
            </select>
          </div>
          <div>
            <label htmlFor="weekly-hours" className="block font-medium">Hours per week</label>
            <input id="weekly-hours" type="number" min="1" max="40" value={weeklyHours}
                   onChange={(e) => setWeeklyHours(e.target.value)}
                   className="mt-2 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3" />
          </div>
        </div>

        <div>
          <label htmlFor="target" className="block font-medium">What should this help you do?</label>
          <input id="target" value={target} maxLength={160} onChange={(e) => setTarget(e.target.value)}
                 placeholder="e.g. Build a portfolio app or pass technical interviews"
                 className="mt-2 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3" />
        </div>

        <div>
          <span id="goal-label" className="block font-medium">Goal</span>
          <div role="radiogroup" aria-labelledby="goal-label" className="mt-2 grid gap-3 sm:grid-cols-3">
            {GOALS.map((g) => (
              <button key={g.value} type="button" role="radio" aria-checked={goal === g.value}
                      onClick={() => { setGoal(g.value); setTouched((t) => ({ ...t, goal: true })); }}
                      className={`rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 ${goal === g.value ? 'border-brand bg-brand-soft shadow-sm' : 'border-ink/10 bg-white/70 hover:border-ink/30'}`}>
                <span className="flex items-center gap-2 font-bold"><Target className="h-4 w-4 text-brand" aria-hidden />{g.label}</span>
                <span className="mt-1 block text-sm text-ink/70">{g.blurb}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 min-h-5 text-sm text-red-700">{touched.goal ? goalError : ''}</p>
        </div>

        {apiError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}

        <button type="submit" disabled={!valid || busy}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? 'Building your path…' : 'Generate roadmap'} {!busy && <WandSparkles className="h-4 w-4" aria-hidden />}
        </button>
      </form>
      </div>
    </div>
  );
}
